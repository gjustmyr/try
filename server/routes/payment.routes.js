const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { authenticate } = require("../middleware/auth");

// Customer payment routes
router.post("/intent", authenticate, paymentController.createPaymentIntent);
router.post("/gcash", authenticate, paymentController.createGCashPayment);
router.post("/paymaya", authenticate, paymentController.createPayMayaPayment);
router.get(
  "/status/:orderId",
  authenticate,
  paymentController.checkPaymentStatus,
);

// Webhook (no authentication - PayMongo will call this)
router.post("/webhook", paymentController.handleWebhook);

module.exports = router;
