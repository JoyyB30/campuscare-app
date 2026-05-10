const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Public authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Optional password routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Simple role test routes
router.get(
  '/community-only',
  verifyToken,
  authorizeRoles('community_member'),
  (req, res) => {
    res.status(200).json({
      message: 'Success. You are a Community Member.'
    });
  }
);

router.get(
  '/manager-only',
  verifyToken,
  authorizeRoles('facility_manager'),
  (req, res) => {
    res.status(200).json({
      message: 'Success. You are a Facility Manager.'
    });
  }
);

router.get(
  '/worker-only',
  verifyToken,
  authorizeRoles('worker'),
  (req, res) => {
    res.status(200).json({
      message: 'Success. You are a Worker.'
    });
  }
);

router.get(
  '/admin-only',
  verifyToken,
  authorizeRoles('admin'),
  (req, res) => {
    res.status(200).json({
      message: 'Success. You are an Admin.'
    });
  }
);

module.exports = router;