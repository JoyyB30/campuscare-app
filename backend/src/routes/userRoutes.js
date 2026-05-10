const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Facility Manager: List worker accounts
router.get(
  '/manager/workers',
  verifyToken,
  authorizeRoles('facility_manager'),
  userController.getAllWorkers
);

// Facility Manager: Activate/deactivate worker account only
router.put(
  '/manager/workers/:id/status',
  verifyToken,
  authorizeRoles('facility_manager'),
  userController.toggleWorkerStatus
);

// Admin: List all users
router.get(
  '/admin/users',
  verifyToken,
  authorizeRoles('admin'),
  userController.getAllUsers
);

// Admin: Activate/deactivate any user account
router.put(
  '/admin/users/:id/status',
  verifyToken,
  authorizeRoles('admin'),
  userController.toggleUserStatus
);

module.exports = router;