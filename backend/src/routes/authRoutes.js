const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// ==========================================
// 1. PUBLIC ROUTES (No Token Needed)
// ==========================================
router.post('/register', authController.register);
router.post('/login', authController.login); 
router.post('/logout', (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
});
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// ==========================================
// 2. PROTECTED ROLE-BASED ROUTES
// ==========================================

// --- COMMUNITY MEMBER ONLY ---
router.get('/community-only', verifyToken, (req, res) => {
    if (req.user && req.user.role === 'community_member') {
        res.json({ message: "Success! You are a Community Member (Student/Staff)." });
    } else {
        res.status(403).json({ error: "Access Denied: Community Members only." });
    }
});

// --- FACILITY MANAGER ONLY ---
router.get('/manager-only', verifyToken, (req, res) => {
    if (req.user && req.user.role === 'facility_manager') {
        res.json({ message: "Success! You are a Facility Manager." });
    } else {
        res.status(403).json({ error: "Access Denied: Facility Managers only." });
    }
});

// --- WORKER ONLY ---
router.get('/worker-only', verifyToken, (req, res) => {
    if (req.user && req.user.role === 'worker') {
        res.json({ message: "Success! You are a maintenance Worker." });
    } else {
        res.status(403).json({ error: "Access Denied: Workers only." });
    }
});

// --- ADMIN ONLY ---
router.get('/admin-only', verifyToken, (req, res) => {
    if (req.user && req.user.role === 'admin') {
        res.json({ message: "Success! You are a System Admin." });
    } else {
        res.status(403).json({ error: "Access Denied: Admin privileges required." });
    }
});

module.exports = router;