const { Order, Delivery } = require("../models");
const { sequelize } = require("../config/database");

// Customer acknowledges delivery received
exports.acknowledgeDelivery = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Find order and verify it belongs to the user
    const order = await Order.findOne({
      where: { id: orderId, userId },
      include: [{ model: Delivery, as: "delivery" }],
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (!order.delivery) {
      return res
        .status(400)
        .json({ success: false, message: "No delivery found for this order" });
    }

    if (order.delivery.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Delivery must be marked as delivered first",
      });
    }

    if (order.delivery.customerAcknowledgedAt) {
      return res.status(400).json({
        success: false,
        message: "Delivery already acknowledged",
      });
    }

    // Mark as acknowledged by customer
    await order.delivery.update(
      {
        customerAcknowledgedAt: new Date(),
      },
      { transaction: t },
    );

    await t.commit();

    res.json({
      success: true,
      message: "Thank you for confirming delivery!",
      data: {
        orderId: order.id,
        acknowledgedAt: order.delivery.customerAcknowledgedAt,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Acknowledge delivery error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to acknowledge delivery" });
  }
};

// Auto-confirm deliveries after 7 days (cron job endpoint)
exports.autoConfirmDeliveries = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find deliveries that were delivered 7+ days ago and not yet acknowledged
    const deliveries = await Delivery.findAll({
      where: {
        status: "delivered",
        deliveredAt: {
          $lte: sevenDaysAgo,
        },
        customerAcknowledgedAt: null,
        autoConfirmedAt: null,
      },
    });

    console.log(`Found ${deliveries.length} deliveries to auto-confirm`);

    let confirmed = 0;
    for (const delivery of deliveries) {
      try {
        await delivery.update({
          autoConfirmedAt: new Date(),
        });
        confirmed++;
      } catch (error) {
        console.error(
          `Failed to auto-confirm delivery ${delivery.id}:`,
          error.message,
        );
      }
    }

    res.json({
      success: true,
      message: `Auto-confirmed ${confirmed} deliveries`,
      data: {
        total: deliveries.length,
        confirmed,
      },
    });
  } catch (error) {
    console.error("Auto-confirm deliveries error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to auto-confirm deliveries" });
  }
};

module.exports = exports;
