const db = require('../db');
const { uploadToCloudinary } = require('../config/cloudinary');

const allowedStatuses = ['pending', 'assigned', 'in_progress', 'resolved', 'closed'];
const allowedPriorities = ['low', 'medium', 'high', 'urgent'];

const createNotification = async (userId, ticketId, type, message) => {
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

const getTicketById = async (ticketId) => {
  const result = await db.query(
    `SELECT * FROM tickets WHERE ticket_id = $1`,
    [ticketId]
  );

  return result.rows[0];
};

const canAccessTicket = (user, ticket) => {
  if (!ticket) return false;

  if (user.role === 'facility_manager' || user.role === 'admin') return true;

  if (user.role === 'community_member') {
    return ticket.created_by === user.id;
  }

  if (user.role === 'worker') {
    return ticket.assigned_to === user.id;
  }

  return false;
};

// 1. Community Member: Create issue
exports.createIssue = async (req, res) => {
  const { title, description, location_id, category_id } = req.body;
  const created_by = req.user.id;
  let photo_url = null;

  if (!title || !description || !location_id || !category_id) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'title, description, location_id, and category_id are required'
    });
  }

  try {
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

    res.status(201).json({
      message: 'Issue created successfully',
      issue: ticket
    });
  } catch (err) {
    console.error('Create issue error:', err);
    res.status(500).json({
      error: 'Failed to create issue',
      detail: err.message
    });
  }
};

// 2. Facility Manager: Get all issues with optional filters
exports.getAllIssues = async (req, res) => {
  const { status, category_id, location_id, priority } = req.query;

  const conditions = [];
  const values = [];

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  if (category_id) {
    values.push(category_id);
    conditions.push(`category_id = $${values.length}`);
  }

  if (location_id) {
    values.push(location_id);
    conditions.push(`location_id = $${values.length}`);
  }

  if (priority) {
    values.push(priority);
    conditions.push(`priority = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await db.query(
      `SELECT *
       FROM tickets
       ${whereClause}
       ORDER BY created_at DESC`,
      values
    );

    res.status(200).json({
      count: result.rows.length,
      issues: result.rows
    });
  } catch (err) {
    console.error('Get all issues error:', err);
    res.status(500).json({
      error: 'Failed to get issues',
      detail: err.message
    });
  }
};

// 3. Community Member: Get my submitted issues
exports.getMyIssues = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT *
       FROM tickets
       WHERE created_by = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      count: result.rows.length,
      issues: result.rows
    });
  } catch (err) {
    console.error('Get my issues error:', err);
    res.status(500).json({
      error: 'Failed to get my issues',
      detail: err.message
    });
  }
};

// 4. Worker: Get assigned issues
exports.getAssignedIssues = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT *
       FROM tickets
       WHERE assigned_to = $1
       ORDER BY updated_at DESC, created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      count: result.rows.length,
      issues: result.rows
    });
  } catch (err) {
    console.error('Get assigned issues error:', err);
    res.status(500).json({
      error: 'Failed to get assigned issues',
      detail: err.message
    });
  }
};

// 5. Get issue by ID with role-based access
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
      `SELECT *
       FROM photos
       WHERE ticket_id = $1
       ORDER BY uploaded_at ASC`,
      [id]
    );

    res.status(200).json({
      issue: ticket,
      comments: comments.rows,
      photos: photos.rows
    });
  } catch (err) {
    console.error('Get issue by ID error:', err);
    res.status(500).json({
      error: 'Failed to get issue',
      detail: err.message
    });
  }
};

// 6. Facility Manager / Worker: Update status
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
  if (ticket.assigned_to !== req.user.id) {
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
    `Worker marked issue "${updatedTicket.title}" as resolved. Please review the completion photo and check the quality of work.`
  );
}

    res.status(200).json({
      message: 'Issue status updated successfully',
      issue: updatedTicket
    });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({
      error: 'Failed to update status',
      detail: err.message
    });
  }
};

// 7. Facility Manager: Assign issue to worker
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

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Issue not found'
      });
    }

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

    res.status(200).json({
      message: 'Issue assigned successfully',
      issue: updatedTicket
    });
  } catch (err) {
    console.error('Assign issue error:', err);
    res.status(500).json({
      error: 'Failed to assign issue',
      detail: err.message
    });
  }
};

// 8. Facility Manager: Close resolved issue
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

    res.status(200).json({
      message: 'Issue closed successfully',
      issue: updatedTicket
    });
  } catch (err) {
    console.error('Close issue error:', err);
    res.status(500).json({
      error: 'Failed to close issue',
      detail: err.message
    });
  }
};

// 9. Facility Manager: Delete issue
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

    res.status(200).json({
      message: 'Issue deleted successfully',
      deletedIssue: result.rows[0]
    });
  } catch (err) {
    console.error('Delete issue error:', err);
    res.status(500).json({
      error: 'Failed to delete issue',
      detail: err.message
    });
  }
};

// 10. Worker: Add comment to assigned issue
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

    if (ticket.assigned_to !== req.user.id) {
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
  'completion',
  `Worker added a comment on issue "${ticket.title}": ${comment_text}`
);

    res.status(201).json({
      message: 'Comment added successfully',
      comment: result.rows[0]
    });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({
      error: 'Failed to add comment',
      detail: err.message
    });
  }
};

// 11. Worker: Upload completion photo for assigned issue
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

    if (ticket.assigned_to !== req.user.id) {
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

    res.status(201).json({
      message: 'Completion photo uploaded successfully',
      photo: photoResult.rows[0],
      issue: updatedTicket
    });
  } catch (err) {
    console.error('Upload completion photo error:', err);
    res.status(500).json({
      error: 'Failed to upload completion photo',
      detail: err.message
    });
  }
};

// 12. Facility Manager: Update priority
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

    res.status(200).json({
      message: 'Issue priority updated successfully',
      issue: result.rows[0]
    });
  } catch (err) {
    console.error('Update priority error:', err);
    res.status(500).json({
      error: 'Failed to update priority',
      detail: err.message
    });
  }
};

// 13. Get my notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT *
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      count: result.rows.length,
      notifications: result.rows
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({
      error: 'Failed to get notifications',
      detail: err.message
    });
  }
};

// 14. Mark notification as read
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

    res.status(200).json({
      message: 'Notification marked as read',
      notification: result.rows[0]
    });
  } catch (err) {
    console.error('Mark notification error:', err);
    res.status(500).json({
      error: 'Failed to update notification',
      detail: err.message
    });
  }
};