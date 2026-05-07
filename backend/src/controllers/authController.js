const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. REGISTER
exports.register = async (req, res) => {
    const { username, email, password, role } = req.body;

    // Define allowed roles to prevent database constraint errors
    const allowedRoles = ['community_member', 'facility_manager', 'worker', 'admin'];
    
    // Validate role
    if (role && !allowedRoles.includes(role)) {
        return res.status(400).json({ 
            error: "Invalid role", 
            message: `Role must be one of: ${allowedRoles.join(', ')}` 
        });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING user_id, username, role",
            [username, email, hashedPassword, role || 'community_member']
        );
        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Registration failed", detail: err.message });
    }
};

// 2. LOGIN (Corrected to use Username)
exports.login = async (req, res) => {
    const { username, password } = req.body; // Changed from email to username

    try {
        // Query database using username column
        const user = await db.query("SELECT * FROM users WHERE username = $1", [username]);
        
        if (user.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Compare password with hashed version
        const validPass = await bcrypt.compare(password, user.rows[0].password);
        if (!validPass) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Create JWT Token including user_id and role
        const token = jwt.sign(
            { id: user.rows[0].user_id, role: user.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        // Return token and user info
        res.json({ 
            token, 
            user: { 
                id: user.rows[0].user_id, 
                role: user.rows[0].role, 
                username: user.rows[0].username 
            } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed", detail: err.message });
    }
};

// 3. LOGOUT 
exports.logout = async (req, res) => {
    // Standard response to tell the frontend to clear the JWT from local storage
    res.status(200).json({ message: "Logged out successfully" });
};

// 4. FORGOT PASSWORD (Updated to use Username)
exports.forgotPassword = async (req, res) => {
    const { username } = req.body; 
    try {
        // Search by username instead of email
        const user = await db.query("SELECT * FROM users WHERE username = $1", [username]);
        
        if (user.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // In a real app, you'd find the user's email here and send the link.
        // For the Milestone, we return success to prove the logic finds the user.
        res.status(200).json({ 
            message: `Password reset link sent to the email associated with ${username}.` 
        });
    } catch (err) {
        res.status(500).json({ error: "Process failed", detail: err.message });
    }
};

// 5. RESET PASSWORD (Updated to use Username)
exports.resetPassword = async (req, res) => {
    const { username, newPassword } = req.body; 
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the password where the username matches
        const result = await db.query(
            "UPDATE users SET password = $1 WHERE username = $2", 
            [hashedPassword, username]
        );

        // Check if the username actually existed to be updated
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "User not found. No password was changed." });
        }
        
        res.status(200).json({ message: "Password updated successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Update failed", detail: err.message });
    }
};