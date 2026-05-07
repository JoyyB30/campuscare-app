
const db = require('../db');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING user_id, username, role", // Fixed: user_id instead of id
            [username, email, hashedPassword, role || 'community_member']
        );
        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error(err); // This prints the REAL error in your terminal
        res.status(500).json({ error: "Registration failed", detail: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) return res.status(404).json("User not found");

        const validPass = await bcrypt.compare(password, user.rows[0].password);
        if (!validPass) return res.status(400).json("Invalid credentials");

        const token = jwt.sign(
            { id: user.rows[0].user_id, role: user.rows[0].role }, // Fixed: user_id
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ token, user: { id: user.rows[0].user_id, role: user.rows[0].role, username: user.rows[0].username } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};