const { Notification } = require("../models");

// Create a notification for a user
const createNotification = async (
  userId,
  type,
  title,
  message,
  orderId = null,
  metadata = null,
) => {
  try {
    const notification = await Notification.create({
      userId,
      orderId,
      type,
      title,
      message,
      metadata,
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

// Order status notification templates
const orderNotificationTemplates = {
  order_placed: (orderNumber) => ({
    type: "order_placed",
    title: "Order Placed Successfully",
    message: `Your order #${orderNumber} has been placed successfully. We'll notify you when it's confirmed.`,
  }),
  order_confirmed: (orderNumber) => ({
    type: "order_confirmed",
    title: "Order Confirmed",
    message: `Great news! Your order #${orderNumber} has been confirmed and is being prepared.`,
  }),
  order_processing: (orderNumber) => ({
    type: "order_processing",
    title: "Order Processing",
    message: `Your order #${orderNumber} is now being processed and will be shipped soon.`,
  }),
  order_shipped: (orderNumber, trackingNumber) => ({
    type: "order_shipped",
    title: "Order Shipped",
    message: `Your order #${orderNumber} has been shipped! ${trackingNumber ? `Tracking: ${trackingNumber}` : ""}`,
  }),
  order_delivered: (orderNumber) => ({
    type: "order_delivered",
    title: "Order Delivered",
    message: `Your order #${orderNumber} has been delivered. Enjoy your purchase!`,
  }),
  order_cancelled: (orderNumber) => ({
    type: "order_cancelled",
    title: "Order Cancelled",
    message: `Your order #${orderNumber} has been cancelled. If you have any questions, please contact support.`,
  }),
  order_failed: (orderNumber) => ({
    type: "order_failed",
    title: "Order Failed",
    message: `Unfortunately, your order #${orderNumber} could not be completed. Please contact support for assistance.`,
  }),
  delivery_assigned: (orderNumber) => ({
    type: "delivery_assigned",
    title: "Delivery Assigned",
    message: `A driver has been assigned to deliver your order #${orderNumber}.`,
  }),
  delivery_picked_up: (orderNumber) => ({
    type: "delivery_picked_up",
    title: "Order Picked Up",
    message: `Your order #${orderNumber} has been picked up by the driver and is on its way!`,
  }),
  delivery_in_transit: (orderNumber) => ({
    type: "delivery_in_transit",
    title: "Order In Transit",
    message: `Your order #${orderNumber} is in transit and will arrive soon.`,
  }),
  delivery_out_for_delivery: (orderNumber) => ({
    type: "delivery_out_for_delivery",
    title: "Out for Delivery",
    message: `Your order #${orderNumber} is out for delivery and will arrive today!`,
  }),
  delivery_at_hub: (orderNumber, hubName) => ({
    type: "delivery_at_hub",
    title: "Order at Hub",
    message: `Your order #${orderNumber} has arrived at ${hubName || "the delivery hub"}.`,
  }),
  payment_success: (orderNumber, amount) => ({
    type: "payment_success",
    title: "Payment Successful",
    message: `Payment of $${amount} for order #${orderNumber} was successful.`,
  }),
  payment_failed: (orderNumber) => ({
    type: "payment_failed",
    title: "Payment Failed",
    message: `Payment for order #${orderNumber} failed. Please try again or use a different payment method.`,
  }),
  refund_processed: (orderNumber, amount) => ({
    type: "refund_processed",
    title: "Refund Processed",
    message: `A refund of $${amount} for order #${orderNumber} has been processed.`,
  }),
};

// Send order status notification
const sendOrderNotification = async (
  userId,
  orderId,
  status,
  orderNumber,
  additionalData = {},
) => {
  const template = orderNotificationTemplates[status];
  if (!template) {
    console.warn(`No notification template found for status: ${status}`);
    return null;
  }

  const { type, title, message } = template(
    orderNumber,
    additionalData.trackingNumber,
    additionalData.hubName,
    additionalData.amount,
  );

  return await createNotification(
    userId,
    type,
    title,
    message,
    orderId,
    additionalData,
  );
};

module.exports = {
  createNotification,
  sendOrderNotification,
  orderNotificationTemplates,
};
