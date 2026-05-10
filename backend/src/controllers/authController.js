const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendResetEmail = require('../utils/mailer');

const allowedRoles = ['community_member', 'facility_manager', 'worker', 'admin'];

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// REGISTER
exports.register = async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'username, email, password, and role are required'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: 'Invalid email',
      message: 'Please provide a valid email address'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'Weak password',
      message: 'Password must be at least 6 characters long'
    });
  }

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      error: 'Invalid role',
      message: `Role must be one of: ${allowedRoles.join(', ')}`
    });
  }

  try {
    const existingUser = await db.query(
      'SELECT user_id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email or username already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.query(
      `INSERT INTO users (username, email, password, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING user_id, username, email, role, is_active, created_at`,
      [username, email, hashedPassword, role]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser.rows[0]
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({
      error: 'Registration failed',
      detail: err.message
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'email and password are required'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: 'Invalid email',
      message: 'Please provide a valid email address'
    });
  }

  try {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    const user = result.rows[0];

    if (user.is_active === false) {
      return res.status(403).json({
        error: 'Account deactivated',
        message: 'Your account is currently deactivated'
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    const token = jwt.sign(
      {
        id: user.user_id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: 'Login failed',
      detail: err.message
    });
  }
};

// LOGOUT
exports.logout = async (req, res) => {
  res.status(200).json({
    message: 'Logged out successfully. Please clear the token on the frontend.'
  });
};

// FORGOT PASSWORD - Optional, using Ethereal test email
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Missing required field',
      message: 'email is required'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: 'Invalid email',
      message: 'Please provide a valid email address'
    });
  }

  try {
    const result = await db.query(
      'SELECT user_id, username, email FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No account exists with this email'
      });
    }

    const user = result.rows[0];

    const previewUrl = await sendResetEmail(user.email, user.username);

    res.status(200).json({
      message: `Password reset email generated for ${user.email}`,
      preview: previewUrl
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({
      error: 'Forgot password process failed',
      detail: err.message
    });
  }
};

// RESET PASSWORD - Optional simplified version
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'email and newPassword are required'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: 'Invalid email',
      message: 'Please provide a valid email address'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      error: 'Weak password',
      message: 'New password must be at least 6 characters long'
    });
  }

  try {
    const existingUser = await db.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No account exists with this email'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await db.query(
      `UPDATE users
       SET password = $1
       WHERE email = $2
       RETURNING user_id, username, email, role`,
      [hashedPassword, email]
    );

    res.status(200).json({
      message: 'Password reset successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({
      error: 'Password reset failed',
      detail: err.message
    });
  }
};