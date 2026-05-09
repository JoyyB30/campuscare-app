const express = require('express');
const router = express.Router();

const issueController = require('../controllers/issueController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Community member creates an issue
router.post(
  '/',
  verifyToken,
  authorizeRoles('community_member'),
  issueController.createIssue
);

// Facility manager views all issues
router.get(
  '/',
  verifyToken,
  authorizeRoles('facility_manager'),
  issueController.getAllIssues
);

// Community member views their own issues
router.get(
  '/my',
  verifyToken,
  authorizeRoles('community_member'),
  issueController.getMyIssues
);

// Get one issue by ID
router.get(
  '/:id',
  verifyToken,
  issueController.getIssueById
);

// Facility manager or worker updates status
router.put(
  '/:id/status',
  verifyToken,
  authorizeRoles('facility_manager', 'worker'),
  issueController.updateIssueStatus
);

// Facility manager assigns issue to worker
router.put(
  '/:id/assign',
  verifyToken,
  authorizeRoles('facility_manager'),
  issueController.assignIssue
);

// Facility manager closes issue
router.put(
  '/:id/close',
  verifyToken,
  authorizeRoles('facility_manager'),
  issueController.closeIssue
);

// Facility manager deletes issue
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('facility_manager'),
  issueController.deleteIssue
);

module.exports = router;