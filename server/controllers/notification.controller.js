const { Notification, Order } = require("../models");
const { Op } = require("sequelize");

// Get all notifications for the authenticated user
exports.getMyNotifications = async (req, res) => {
  try {
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;

    const where = { userId: req.user.id };
    if (unreadOnly === "true") {
      where.isRead = false;
    }

    const notifications = await Notification.findAll({
      where,
      include: [
        {
          model: Order,
          as: "order",
          attributes: ["id", "orderNumber", "status", "total"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const unreadCount = await Notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get notifications",
    });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, userId: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (!notification.isRead) {
      await notification.update({
        isRead: true,
        readAt: new Date(),
      });
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      {
        isRead: true,
        readAt: new Date(),
      },
      {
        where: {
          userId: req.user.id,
          isRead: false,
        },
      },
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, userId: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};

// Delete all read notifications
exports.deleteAllRead = async (req, res) => {
  try {
    await Notification.destroy({
      where: {
        userId: req.user.id,
        isRead: true,
      },
    });

    res.json({
      success: true,
      message: "All read notifications deleted",
    });
  } catch (error) {
    console.error("Delete all read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete read notifications",
    });
  }
};

module.exports = exports;
