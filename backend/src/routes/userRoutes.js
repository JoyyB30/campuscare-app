const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Facility Manager routes
router.get(
  '/manager/workers',
  verifyToken,
  authorizeRoles('facility_manager'),
  userController.getAllWorkers
);

router.put(
  '/manager/workers/:id/status',
  verifyToken,
  authorizeRoles('facility_manager'),
  userController.toggleUserStatus
);

// Admin routes
router.get(
  '/admin/users',
  verifyToken,
  authorizeRoles('admin'),
  userController.getAllUsers
);

router.put(
  '/admin/users/:id/status',
  verifyToken,
  authorizeRoles('admin'),
  userController.toggleUserStatus
);

module.exports = router;