const db = require('../db');
const { uploadToCloudinary } = require('../config/cloudinary');

const allowedStatuses = ['pending', 'assigned', 'in_progress', 'resolved', 'closed'];
const allowedPriorities = ['low', 'medium', 'high', 'urgent'];

const createNotification = async (userId, ticketId, type, message) => {
  if (!userId || !ticketId || !type || !message) return;

  await db.query(
    `INSERT INTO notifications (user_id, ticket_id, notification_type, message, is_read)
     VALUES ($1, $2, $3, $4, false)`,
    [userId, ticketId, type, message]
  );
};

const notifyFacilityManagers = async (ticketId, type, message) => {
  const managers = await db.query(
    `SELECT user_id FROM users
     WHERE role = 'facility_manager' AND is_active = true`
  );

  for (const manager of managers.rows) {
    await createNotification(manager.user_id, ticketId, type, message);
  }
};

const ticketSelect = `
  SELECT
    t.*,
    t.created_at AS submitted_at,
    c.category_name AS category,
    c.category_type,
    l.building_name,
    l.floor,
    l.room_number,
    l.area,
    l.location_type,
    CONCAT_WS(' - ', l.building_name, l.floor, l.room_number, l.area) AS location_name,
    creator.username AS creator_username,
    creator.email AS creator_email,
    worker.username AS assigned_worker_name,
    worker.email AS assigned_worker_email
  FROM tickets t
  LEFT JOIN categories c ON t.category_id = c.category_id
  LEFT JOIN locations l ON t.location_id = l.location_id
  LEFT JOIN users creator ON t.created_by = creator.user_id
  LEFT JOIN users worker ON t.assigned_to = worker.user_id
`;

const getTicketById = async (ticketId) => {
  const result = await db.query(
    `${ticketSelect} WHERE t.ticket_id = $1`,
    [ticketId]
  );

  return result.rows[0];
};

const canAccessTicket = (user, ticket) => {
  if (!ticket) return false;

  if (user.role === 'facility_manager' || user.role === 'admin') return true;

  if (user.role === 'community_member') {
    return Number(ticket.created_by) === Number(user.id);
  }

  if (user.role === 'worker') {
    return Number(ticket.assigned_to) === Number(user.id);
  }

  return false;
};

exports.getCategories = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT category_id, category_name, category_type, is_active
       FROM categories
       WHERE is_active = true
       ORDER BY category_name ASC`
    );

    return res.status(200).json({
      count: result.rows.length,
      categories: result.rows
    });
  } catch (err) {
    console.error('Get categories error:', err);
    return res.status(500).json({
      error: 'Failed to get categories',
      detail: err.message
    });
  }
};

exports.getLocations = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT location_id, building_name, floor, room_number, area, location_type, description, is_active,
              CONCAT_WS(' - ', building_name, floor, room_number, area) AS location_name
       FROM locations
       WHERE is_active = true
       ORDER BY building_name ASC, floor ASC, room_number ASC`
    );

    return res.status(200).json({
      count: result.rows.length,
      locations: result.rows
    });
  } catch (err) {
    console.error('Get locations error:', err);
    return res.status(500).json({
      error: 'Failed to get locations',
      detail: err.message
    });
  }
};

// Community Member: Create issue
exports.createIssue = async (req, res) => {
  const { description, location_id, category_id } = req.body;
  let { title } = req.body;

  const created_by = req.user.id;
  let photo_url = null;

  if (!description || !location_id || !category_id) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'description, location_id, and category_id are required'
    });
  }

  try {
    const categoryResult = await db.query(
      'SELECT category_name FROM categories WHERE category_id = $1 AND is_active = true',
      [category_id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid category',
        message: 'Selected category does not exist'
      });
    }

    const locationResult = await db.query(
      'SELECT location_id FROM locations WHERE location_id = $1 AND is_active = true',
      [location_id]
    );

    if (locationResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid location',
        message: 'Selected location does not exist'
      });
    }

    if (!title || title.trim() === '') {
      title = `${categoryResult.rows[0].category_name} issue`;
    }

    if (req.file) {
      photo_url = await uploadToCloudinary(req.file.buffer, 'issue_photos');
    }

    const result = await db.query(
      `INSERT INTO tickets
       (title, description, location_id, category_id, photo_url, created_by, status, priority)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', 'medium')
       RETURNING *`,
      [title, description, location_id, category_id, photo_url, created_by]
    );

    const ticket = result.rows[0];

    await notifyFacilityManagers(
      ticket.ticket_id,
      'status_change',
      `New issue submitted: ${ticket.title}`
    );

    const fullTicket = await getTicketById(ticket.ticket_id);

    return res.status(201).json({
      message: 'Issue created successfully',
      issue: fullTicket
    });
  } catch (err) {
    console.error('Create issue error:', err);
    return res.status(500).json({
      error: 'Failed to create issue',
      detail: err.message
    });
  }
};

// Facility Manager: Get all issues with optional filters
exports.getAllIssues = async (req, res) => {
  const { status, category_id, location_id, priority, from_date, to_date, date } = req.query;

  const conditions = [];
  const values = [];

  if (status) {
    values.push(status);
    conditions.push(`t.status = $${values.length}`);
  }

  if (category_id) {
    values.push(category_id);
    conditions.push(`t.category_id = $${values.length}`);
  }

  if (location_id) {
    values.push(location_id);
    conditions.push(`t.location_id = $${values.length}`);
  }

  if (priority) {
    values.push(priority);
    conditions.push(`t.priority = $${values.length}`);
  }

  if (date) {
    values.push(date);
    conditions.push(`DATE(t.created_at) = DATE($${values.length})`);
  }

  if (from_date) {
    values.push(from_date);
    conditions.push(`DATE(t.created_at) >= DATE($${values.length})`);
  }

  if (to_date) {
    values.push(to_date);
    conditions.push(`DATE(t.created_at) <= DATE($${values.length})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await db.query(
      `${ticketSelect}
       ${whereClause}
       ORDER BY t.created_at DESC`,
      values
    );

    return res.status(200).json({
      count: result.rows.length,
      issues: result.rows
    });
  } catch (err) {
    console.error('Get all issues error:', err);
    return res.status(500).json({
      error: 'Failed to get issues',
      detail: err.message
    });
  }
};

// Community Member: Get my submitted issues
exports.getMyIssues = async (req, res) => {
  try {
    const result = await db.query(
      `${ticketSelect}
       WHERE t.created_by = $1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      count: result.rows.length,
      issues: result.rows
    });
  } catch (err) {
    console.error('Get my issues error:', err);
    return res.status(500).json({
      error: 'Failed to get my issues',
      detail: err.message
    });
  }
};

// Worker: Get assigned issues
exports.getAssignedIssues = async (req, res) => {
  try {
    const result = await db.query(
      `${ticketSelect}
       WHERE t.assigned_to = $1
       ORDER BY t.updated_at DESC, t.created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      count: result.rows.length,
      issues: result.rows
    });
  } catch (err) {
    console.error('Get assigned issues error:', err);
    return res.status(500).json({
      error: 'Failed to get assigned issues',
      detail: err.message
    });
  }
};

// Get issue by ID with role-based access
exports.getIssueById = async (req, res) => {
  const { id } = req.params;

  try {
    const ticket = await getTicketById(id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Issue not found'
      });
    }

    if (!canAccessTicket(req.user, ticket)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not allowed to view this issue'
      });
    }

    const comments = await db.query(
      `SELECT c.*, u.username, u.role
       FROM comments c
       JOIN users u ON c.user_id = u.user_id
       WHERE c.ticket_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );

    const photos = await db.query(
      `SELECT p.*, u.username AS uploaded_by_name
       FROM photos p
       LEFT JOIN users u ON p.uploaded_by = u.user_id
       WHERE p.ticket_id = $1
       ORDER BY p.uploaded_at ASC`,
      [id]
    );

    return res.status(200).json({
      issue: ticket,
      comments: comments.rows,
      photos: photos.rows
    });
  } catch (err) {
    console.error('Get issue by ID error:', err);
    return res.status(500).json({
      error: 'Failed to get issue',
      detail: err.message
    });
  }
};

// Facility Manager / Worker: Update status
exports.updateIssueStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      error: 'Missing required field',
      message: 'status is required'
    });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Invalid status',
      message: `Status must be one of: ${allowedStatuses.join(', ')}`
    });
  }

  try {
    const ticket = await getTicketById(id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Issue not found'
      });
    }

    if (req.user.role === 'worker') {
      if (Number(ticket.assigned_to) !== Number(req.user.id)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Workers can only update issues assigned to them'
        });
      }

      if (status !== 'in_progress' && status !== 'resolved') {
        return res.status(403).json({
          error: 'Invalid worker action',
          message: 'Workers can only mark assigned issues as in_progress or resolved'
        });
      }

      if (status === 'resolved' && !ticket.completed_photo_url) {
        return res.status(400).json({
          error: 'Completion photo required',
          message: 'Worker must upload a completion photo before marking the issue as resolved'
        });
      }
    }

    const result = await db.query(
      `UPDATE tickets
       SET status = $1, updated_at = NOW()
       WHERE ticket_id = $2
       RETURNING *`,
      [status, id]
    );

    const updatedTicket = result.rows[0];

    if (updatedTicket.created_by) {
      await createNotification(
        updatedTicket.created_by,
        updatedTicket.ticket_id,
        'status_change',
        `Your issue "${updatedTicket.title}" status changed to ${status}`
      );
    }

    if (req.user.role === 'worker' && status === 'resolved') {
      await notifyFacilityManagers(
        updatedTicket.ticket_id,
        'completion',
        `Worker marked issue "${updatedTicket.title}" as resolved. Please review the completion photo.`
      );
    }

    const fullTicket = await getTicketById(updatedTicket.ticket_id);

    return res.status(200).json({
      message: 'Issue status updated successfully',
      issue: fullTicket
    });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({
      error: 'Failed to update status',
      detail: err.message
    });
  }
};

// Facility Manager: Assign issue to worker
exports.assignIssue = async (req, res) => {
  const { id } = req.params;
  const { assigned_to } = req.body;

  if (!assigned_to) {
    return res.status(400).json({
      error: 'Missing required field',
      message: 'assigned_to is required'
    });
  }

  try {
    const ticket = await getTicketById(id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Issue not found'
      });
    }

    const worker = await db.query(
      `SELECT user_id, username, role, is_active
       FROM users
       WHERE user_id = $1`,
      [assigned_to]
    );

    if (worker.rows.length === 0) {
      return res.status(404).json({
        error: 'Worker not found'
      });
    }

    if (worker.rows[0].role !== 'worker') {
      return res.status(400).json({
        error: 'Invalid assignment',
        message: 'Issue can only be assigned to a user with role worker'
      });
    }

    if (worker.rows[0].is_active === false) {
      return res.status(400).json({
        error: 'Inactive worker',
        message: 'Cannot assign issue to an inactive worker'
      });
    }

    const result = await db.query(
      `UPDATE tickets
       SET assigned_to = $1, status = 'assigned', updated_at = NOW()
       WHERE ticket_id = $2
       RETURNING *`,
      [assigned_to, id]
    );

    const updatedTicket = result.rows[0];

    await createNotification(
      assigned_to,
      updatedTicket.ticket_id,
      'assignment',
      `You have been assigned a new issue: ${updatedTicket.title}`
    );

    if (updatedTicket.created_by) {
      await createNotification(
        updatedTicket.created_by,
        updatedTicket.ticket_id,
        'status_change',
        `Your issue "${updatedTicket.title}" has been assigned to a worker`
      );
    }

    const fullTicket = await getTicketById(updatedTicket.ticket_id);

    return res.status(200).json({
      message: 'Issue assigned successfully',
      issue: fullTicket
    });
  } catch (err) {
    console.error('Assign issue error:', err);
    return res.status(500).json({
      error: 'Failed to assign issue',
      detail: err.message
    });
  }
};

// Facility Manager: Close resolved issue
exports.closeIssue = async (req, res) => {
  const { id } = req.params;

  try {
    const ticket = await getTicketById(id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Issue not found'
      });
    }

    if (ticket.status !== 'resolved') {
      return res.status(400).json({
        error: 'Issue is not resolved',
        message: 'Only resolved issues can be closed'
      });
    }

    const result = await db.query(
      `UPDATE tickets
       SET status = 'closed', updated_at = NOW()
       WHERE ticket_id = $1
       RETURNING *`,
      [id]
    );

    const updatedTicket = result.rows[0];

    if (updatedTicket.created_by) {
      await createNotification(
        updatedTicket.created_by,
        updatedTicket.ticket_id,
        'status_change',
        `Your issue "${updatedTicket.title}" has been closed`
      );
    }

    const fullTicket = await getTicketById(updatedTicket.ticket_id);

    return res.status(200).json({
      message: 'Issue closed successfully',
      issue: fullTicket
    });
  } catch (err) {
    console.error('Close issue error:', err);
    return res.status(500).json({
      error: 'Failed to close issue',
      detail: err.message
    });
  }
};

// Facility Manager: Delete issue
exports.deleteIssue = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM tickets
       WHERE ticket_id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Issue not found'
      });
    }

    return res.status(200).json({
      message: 'Issue deleted successfully',
      deletedIssue: result.rows[0]
    });
  } catch (err) {
    console.error('Delete issue error:', err);
    return res.status(500).json({
      error: 'Failed to delete issue',
      detail: err.message
    });
  }
};

// Worker: Add comment to assigned issue
exports.addComment = async (req, res) => {
  const { id } = req.params;
  const { comment_text } = req.body;

  if (!comment_text) {
    return res.status(400).json({
      error: 'Missing required field',
      message: 'comment_text is required'
    });
  }

  try {
    const ticket = await getTicketById(id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Issue not found'
      });
    }

    if (Number(ticket.assigned_to) !== Number(req.user.id)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Workers can only comment on issues assigned to them'
      });
    }

    const result = await db.query(
      `INSERT INTO comments (comment_text, ticket_id, user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [comment_text, id, req.user.id]
    );

    await notifyFacilityManagers(
      id,
      'status_change',
      `Worker added a comment on issue "${ticket.title}": ${comment_text}`
    );

    return res.status(201).json({
      message: 'Comment added successfully',
      comment: result.rows[0]
    });
  } catch (err) {
    console.error('Add comment error:', err);
    return res.status(500).json({
      error: 'Failed to add comment',
      detail: err.message
    });
  }
};

// Worker: Upload completion photo for assigned issue
exports.uploadCompletionPhoto = async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({
      error: 'Missing file',
      message: 'photo is required'
    });
  }

  try {
    const ticket = await getTicketById(id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Issue not found'
      });
    }

    if (Number(ticket.assigned_to) !== Number(req.user.id)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Workers can only upload completion photos for issues assigned to them'
      });
    }

    const photoUrl = await uploadToCloudinary(req.file.buffer, 'completion_photos');

    const photoResult = await db.query(
      `INSERT INTO photos (photo_url, photo_type, ticket_id, uploaded_by)
       VALUES ($1, 'completion', $2, $3)
       RETURNING *`,
      [photoUrl, id, req.user.id]
    );

    const ticketResult = await db.query(
      `UPDATE tickets
       SET completed_photo_url = $1, status = 'resolved', updated_at = NOW()
       WHERE ticket_id = $2
       RETURNING *`,
      [photoUrl, id]
    );

    const updatedTicket = ticketResult.rows[0];

    await notifyFacilityManagers(
      id,
      'completion',
      `Worker uploaded a completion photo for issue "${updatedTicket.title}"`
    );

    if (updatedTicket.created_by) {
      await createNotification(
        updatedTicket.created_by,
        updatedTicket.ticket_id,
        'status_change',
        `Your issue "${updatedTicket.title}" has been marked as resolved`
      );
    }

    const fullTicket = await getTicketById(updatedTicket.ticket_id);

    return res.status(201).json({
      message: 'Completion photo uploaded successfully',
      photo: photoResult.rows[0],
      issue: fullTicket
    });
  } catch (err) {
    console.error('Upload completion photo error:', err);
    return res.status(500).json({
      error: 'Failed to upload completion photo',
      detail: err.message
    });
  }
};

// Facility Manager: Update priority
exports.updateIssuePriority = async (req, res) => {
  const { id } = req.params;
  const { priority } = req.body;

  if (!priority) {
    return res.status(400).json({
      error: 'Missing required field',
      message: 'priority is required'
    });
  }

  if (!allowedPriorities.includes(priority)) {
    return res.status(400).json({
      error: 'Invalid priority',
      message: `Priority must be one of: ${allowedPriorities.join(', ')}`
    });
  }

  try {
    const result = await db.query(
      `UPDATE tickets
       SET priority = $1, updated_at = NOW()
       WHERE ticket_id = $2
       RETURNING *`,
      [priority, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Issue not found'
      });
    }

    const fullTicket = await getTicketById(id);

    return res.status(200).json({
      message: 'Issue priority updated successfully',
      issue: fullTicket
    });
  } catch (err) {
    console.error('Update priority error:', err);
    return res.status(500).json({
      error: 'Failed to update priority',
      detail: err.message
    });
  }
};

// Get my notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT n.*, t.title, t.status, t.priority
       FROM notifications n
       LEFT JOIN tickets t ON n.ticket_id = t.ticket_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      count: result.rows.length,
      notifications: result.rows
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({
      error: 'Failed to get notifications',
      detail: err.message
    });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const result = await db.query(
      `UPDATE notifications
       SET is_read = true
       WHERE notification_id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }

    return res.status(200).json({
      message: 'Notification marked as read',
      notification: result.rows[0]
    });
  } catch (err) {
    console.error('Mark notification error:', err);
    return res.status(500).json({
      error: 'Failed to update notification',
      detail: err.message
    });
  }
};