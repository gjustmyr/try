const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

// Get all notifications for authenticated user
router.get("/", notificationController.getMyNotifications);

// Get unread count
router.get("/unread-count", notificationController.getUnreadCount);

// Mark notification as read
router.put("/:id/read", notificationController.markAsRead);

// Mark all notifications as read
router.put("/read-all", notificationController.markAllAsRead);

// Delete a notification
router.delete("/:id", notificationController.deleteNotification);

// Delete all read notifications
router.delete("/read/all", notificationController.deleteAllRead);

module.exports = router;
