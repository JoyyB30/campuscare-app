const db = require('../db');

// GET /api/manager/workers - List workers for FM
exports.getAllWorkers = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT user_id, username, email, is_active FROM users WHERE role = 'worker'"
        );
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch workers", detail: err.message });
    }
};

// GET /api/admin/users - List all users for Admin
exports.getAllUsers = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT user_id, username, email, role, is_active, created_at FROM users"
        );
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users", detail: err.message });
    }
};

// PUT /api/status/:id - Toggle is_active status
exports.toggleUserStatus = async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body; 

    try {
        const result = await db.query(
            "UPDATE users SET is_active = $1 WHERE user_id = $2 RETURNING user_id, username, is_active",
            [is_active, id]
        );

        if (result.rowCount === 0) return res.status(404).json({ error: "User not found" });

        res.status(200).json({ 
            message: `Account ${is_active ? 'activated' : 'deactivated'}`,
            user: result.rows[0] 
        });
    } catch (err) {
        res.status(500).json({ error: "Update failed", detail: err.message });
    }
};