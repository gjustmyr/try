const paymentService = require("../services/payment.service");
const { Order } = require("../models");
const { sequelize } = require("../config/database");

// Create payment intent for an order
exports.createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    // Find order and verify ownership
    const order = await Order.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order already paid",
      });
    }

    // Create payment intent
    const result = await paymentService.createPaymentIntent({
      amount: parseFloat(order.total),
      description: `Order ${order.orderNumber}`,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
      },
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    // Store payment intent ID in order
    await order.update({
      paymentIntentId: result.data.id,
      paymentMethod: "online",
    });

    res.json({
      success: true,
      data: {
        clientKey: result.data.attributes.client_key,
        paymentIntentId: result.data.id,
        amount: result.data.attributes.amount / 100, // Convert back to pesos
      },
    });
  } catch (error) {
    console.error("Create payment intent error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment intent",
    });
  }
};

// Create GCash payment
exports.createGCashPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order already paid",
      });
    }

    const result = await paymentService.createGCashPayment(
      parseFloat(order.total),
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
      },
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    // Store source ID in order
    await order.update({
      paymentSourceId: result.data.id,
      paymentMethod: "gcash",
    });

    res.json({
      success: true,
      data: {
        sourceId: result.data.id,
        checkoutUrl: result.checkoutUrl,
      },
    });
  } catch (error) {
    console.error("Create GCash payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create GCash payment",
    });
  }
};

// Create PayMaya payment
exports.createPayMayaPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order already paid",
      });
    }

    const result = await paymentService.createPayMayaPayment(
      parseFloat(order.total),
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
      },
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    await order.update({
      paymentSourceId: result.data.id,
      paymentMethod: "paymaya",
    });

    res.json({
      success: true,
      data: {
        sourceId: result.data.id,
        checkoutUrl: result.checkoutUrl,
      },
    });
  } catch (error) {
    console.error("Create PayMaya payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create PayMaya payment",
    });
  }
};

// Webhook handler for payment status updates
exports.handleWebhook = async (req, res) => {
  try {
    const event = req.body.data;

    console.log("Payment webhook received:", event.attributes.type);

    // Handle different event types
    switch (event.attributes.type) {
      case "payment.paid":
        await handlePaymentPaid(event);
        break;
      case "payment.failed":
        await handlePaymentFailed(event);
        break;
      case "source.chargeable":
        await handleSourceChargeable(event);
        break;
      default:
        console.log("Unhandled event type:", event.attributes.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
};

// Handle successful payment
async function handlePaymentPaid(event) {
  const t = await sequelize.transaction();
  try {
    const metadata = event.attributes.data.attributes.metadata;
    const orderId = metadata.orderId;

    const order = await Order.findByPk(orderId, { transaction: t });
    if (!order) {
      console.error("Order not found:", orderId);
      return;
    }

    await order.update(
      {
        paymentStatus: "paid",
        paidAt: new Date(),
        status: "confirmed", // Move to confirmed after payment
      },
      { transaction: t },
    );

    await t.commit();
    console.log(`Order ${order.orderNumber} marked as paid`);
  } catch (error) {
    await t.rollback();
    console.error("Handle payment paid error:", error);
  }
}

// Handle failed payment
async function handlePaymentFailed(event) {
  try {
    const metadata = event.attributes.data.attributes.metadata;
    const orderId = metadata.orderId;

    const order = await Order.findByPk(orderId);
    if (!order) {
      console.error("Order not found:", orderId);
      return;
    }

    await order.update({
      paymentStatus: "failed",
    });

    console.log(`Order ${order.orderNumber} payment failed`);
  } catch (error) {
    console.error("Handle payment failed error:", error);
  }
}

// Handle chargeable source (GCash/PayMaya ready to charge)
async function handleSourceChargeable(event) {
  const t = await sequelize.transaction();
  try {
    const sourceId = event.attributes.data.id;
    const metadata = event.attributes.data.attributes.metadata;
    const orderId = metadata.orderId;
    const amount = event.attributes.data.attributes.amount / 100;

    const order = await Order.findByPk(orderId, { transaction: t });
    if (!order) {
      console.error("Order not found:", orderId);
      return;
    }

    // Create payment to capture funds
    const result = await paymentService.createPayment(
      sourceId,
      amount,
      metadata,
    );

    if (result.success) {
      await order.update(
        {
          paymentStatus: "paid",
          paidAt: new Date(),
          status: "confirmed",
        },
        { transaction: t },
      );

      await t.commit();
      console.log(`Order ${order.orderNumber} charged successfully`);
    } else {
      await t.rollback();
      console.error("Failed to charge source:", result.message);
    }
  } catch (error) {
    await t.rollback();
    console.error("Handle source chargeable error:", error);
  }
}

// Check payment status
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    let paymentStatus = order.paymentStatus;

    // If payment is pending, check with PayMongo
    if (paymentStatus === "pending" && order.paymentIntentId) {
      const result = await paymentService.getPaymentIntent(
        order.paymentIntentId,
      );
      if (result.success) {
        paymentStatus = result.status;

        // Update order if status changed
        if (result.status === "succeeded" && order.paymentStatus !== "paid") {
          await order.update({
            paymentStatus: "paid",
            paidAt: new Date(),
            status: "confirmed",
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentStatus,
        paymentMethod: order.paymentMethod,
        total: order.total,
        paidAt: order.paidAt,
      },
    });
  } catch (error) {
    console.error("Check payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check payment status",
    });
  }
};

module.exports = exports;
