const db = require('../db');
const { uploadToCloudinary } = require('../config/cloudinary');

// 1. Create a new issue
exports.createIssue = async (req, res) => {
  const { title, description, location_id, category_id, photo_url } = req.body;
  const created_by = req.user.id;

  if (!title || !description || !location_id || !category_id) {
    return res.status(400).json({
      error: "Missing required fields",
      message: "title, description, location_id, and category_id are required"
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO tickets 
       (title, description, location_id, category_id, photo_url, created_by, status, priority)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', 'medium')
       RETURNING *`,
      [title, description, location_id, category_id, photo_url || null, created_by]
    );

    res.status(201).json({
      message: "Issue created successfully",
      issue: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create issue", detail: err.message });
  }
};

// 2. Get all issues
exports.getAllIssues = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM tickets ORDER BY created_at DESC`
    );

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to get issues", detail: err.message });
  }
};

// 3. Get my issues
exports.getMyIssues = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM tickets WHERE created_by = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to get my issues", detail: err.message });
  }
};

// 4. Get one issue by ID
exports.getIssueById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT * FROM tickets WHERE ticket_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Issue not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to get issue", detail: err.message });
  }
};

// 5. Update issue status
exports.updateIssueStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ['pending', 'assigned', 'in_progress', 'resolved', 'closed'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid status",
      message: `Status must be one of: ${allowedStatuses.join(', ')}`
    });
  }

  try {
    const result = await db.query(
      `UPDATE tickets 
       SET status = $1, updated_at = NOW()
       WHERE ticket_id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Issue not found" });
    }

    res.status(200).json({
      message: "Issue status updated successfully",
      issue: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status", detail: err.message });
  }
};

// 6. Delete issue
exports.deleteIssue = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM tickets WHERE ticket_id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Issue not found" });
    }

    res.status(200).json({ message: "Issue deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete issue", detail: err.message });
  }
};

// 7. Assign issue to worker
exports.assignIssue = async (req, res) => {
  const { id } = req.params;
  const { assigned_to } = req.body;

  if (!assigned_to) {
    return res.status(400).json({
      error: "Missing required field",
      message: "assigned_to is required"
    });
  }

  try {
    const worker = await db.query(
      `SELECT user_id, role FROM users WHERE user_id = $1`,
      [assigned_to]
    );

    if (worker.rows.length === 0) {
      return res.status(404).json({ error: "Worker not found" });
    }

    if (worker.rows[0].role !== 'worker') {
      return res.status(400).json({
        error: "Invalid assignment",
        message: "Issue can only be assigned to a user with role worker"
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
      return res.status(404).json({ error: "Issue not found" });
    }

    res.status(200).json({
      message: "Issue assigned successfully",
      issue: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to assign issue", detail: err.message });
  }
};

// 8. Close resolved issue
exports.closeIssue = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE tickets
       SET status = 'closed', updated_at = NOW()
       WHERE ticket_id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Issue not found" });
    }

    res.status(200).json({
      message: "Issue closed successfully",
      issue: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to close issue", detail: err.message });
  }
};

// 9. Add comment to issue
exports.addComment = async (req, res) => {
  const { id } = req.params;
  const { comment_text } = req.body;
  const user_id = req.user.id;

  if (!comment_text) {
    return res.status(400).json({
      error: 'Missing required field',
      message: 'comment_text is required',
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO comments (comment_text, ticket_id, user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [comment_text, id, user_id]
    );

    res.status(201).json({
      message: 'Comment added successfully',
      comment: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to add comment',
      detail: err.message,
    });
  }
};

// 10. Upload completion photo
exports.uploadCompletionPhoto = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded',
      message: 'Please upload an image file',
    });
  }

  try {
    const photoUrl = await uploadToCloudinary(
      req.file.buffer,
      'campuscare/completion-photos'
    );

    const result = await db.query(
      `INSERT INTO photos (photo_url, photo_type, ticket_id, uploaded_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [photoUrl, 'completion', id, user_id]
    );

    res.status(200).json({
      message: 'Completion photo uploaded successfully',
      photo: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to upload completion photo',
      detail: err.message,
    });
  }
};

// 11. Get notifications for logged-in user
exports.getMyNotifications = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await db.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to get notifications',
      detail: err.message,
    });
  }
};

// 12. Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const result = await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE notification_id = $1
       RETURNING *`,
      [notificationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Notification not found',
      });
    }

    res.status(200).json({
      message: 'Notification marked as read',
      notification: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to update notification',
      detail: err.message,
    });
  }
};