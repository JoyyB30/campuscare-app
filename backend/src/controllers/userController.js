const db = require('../db');

// Facility Manager: List worker accounts only
exports.getAllWorkers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT user_id, username, email, role, is_active, created_at
       FROM users
       WHERE role = 'worker'
       ORDER BY created_at DESC`
    );

    res.status(200).json({
      count: result.rows.length,
      workers: result.rows
    });
  } catch (err) {
    console.error('Get workers error:', err);
    res.status(500).json({
      error: 'Failed to fetch workers',
      detail: err.message
    });
  }
};

// Facility Manager: Activate/deactivate worker accounts only
exports.toggleWorkerStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({
      error: 'Invalid value',
      message: 'is_active must be true or false'
    });
  }

  try {
    const worker = await db.query(
      `SELECT user_id, role
       FROM users
       WHERE user_id = $1`,
      [id]
    );

    if (worker.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    if (worker.rows[0].role !== 'worker') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Facility Managers can only activate or deactivate worker accounts'
      });
    }

    const result = await db.query(
      `UPDATE users
       SET is_active = $1
       WHERE user_id = $2
       RETURNING user_id, username, email, role, is_active`,
      [is_active, id]
    );

    res.status(200).json({
      message: `Worker account ${is_active ? 'activated' : 'deactivated'} successfully`,
      worker: result.rows[0]
    });
  } catch (err) {
    console.error('Toggle worker status error:', err);
    res.status(500).json({
      error: 'Failed to update worker status',
      detail: err.message
    });
  }
};

// Admin: List all registered users
exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT user_id, username, email, role, is_active, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.status(200).json({
      count: result.rows.length,
      users: result.rows
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({
      error: 'Failed to fetch users',
      detail: err.message
    });
  }
};

// Admin: Activate/deactivate any user account
exports.toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({
      error: 'Invalid value',
      message: 'is_active must be true or false'
    });
  }

  try {
    const result = await db.query(
      `UPDATE users
       SET is_active = $1
       WHERE user_id = $2
       RETURNING user_id, username, email, role, is_active`,
      [is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.status(200).json({
      message: `User account ${is_active ? 'activated' : 'deactivated'} successfully`,
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Toggle user status error:', err);
    res.status(500).json({
      error: 'Failed to update user status',
      detail: err.message
    });
  }
};