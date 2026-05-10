const express = require('express');
const router = express.Router();

const upload = require('../middleware/uploadMiddleware');
const issueController = require('../controllers/issueController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Community Member: submit issue
router.post(
  '/',
  verifyToken,
  authorizeRoles('community_member'),
  upload.single('photo'),
  issueController.createIssue
);

// Facility Manager: view all issues, with optional filters
// Example: /api/issues?status=pending&priority=high
router.get(
  '/',
  verifyToken,
  authorizeRoles('facility_manager'),
  issueController.getAllIssues
);

// Community Member: view own submitted issues
router.get(
  '/my',
  verifyToken,
  authorizeRoles('community_member'),
  issueController.getMyIssues
);

// Worker: view assigned issues
router.get(
  '/assigned/my',
  verifyToken,
  authorizeRoles('worker'),
  issueController.getAssignedIssues
);

// Notifications
router.get(
  '/notifications/my',
  verifyToken,
  issueController.getMyNotifications
);

router.put(
  '/notifications/:notificationId/read',
  verifyToken,
  issueController.markNotificationAsRead
);

// Get issue details
router.get(
  '/:id',
  verifyToken,
  issueController.getIssueById
);

// Facility Manager or Worker: update status
router.put(
  '/:id/status',
  verifyToken,
  authorizeRoles('facility_manager', 'worker'),
  issueController.updateIssueStatus
);

// Facility Manager: assign issue to worker
router.put(
  '/:id/assign',
  verifyToken,
  authorizeRoles('facility_manager'),
  issueController.assignIssue
);

// Facility Manager: update issue priority
router.put(
  '/:id/priority',
  verifyToken,
  authorizeRoles('facility_manager'),
  issueController.updateIssuePriority
);

// Facility Manager: close resolved issue
router.put(
  '/:id/close',
  verifyToken,
  authorizeRoles('facility_manager'),
  issueController.closeIssue
);

// Worker: add comment to assigned issue
router.post(
  '/:id/comments',
  verifyToken,
  authorizeRoles('worker'),
  issueController.addComment
);

// Worker: upload completion photo for assigned issue
router.post(
  '/:id/photo',
  verifyToken,
  authorizeRoles('worker'),
  upload.single('photo'),
  issueController.uploadCompletionPhoto
);

// Facility Manager: delete issue
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('facility_manager'),
  issueController.deleteIssue
);

module.exports = router;