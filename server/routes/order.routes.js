const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const acknowledgmentController = require("../controllers/order-acknowledgment.controller");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

router.post("/", orderController.placeOrder);
router.get("/", orderController.getOrders);
router.get("/seller", orderController.getSellerOrders);
router.get("/:orderId/tracking", orderController.getOrderTracking);
router.put("/:orderId/status", orderController.updateOrderStatus);
router.get("/:orderId", orderController.getOrder);

// Customer acknowledgment
router.post(
  "/:orderId/acknowledge",
  acknowledgmentController.acknowledgeDelivery,
);

// Auto-confirm (admin/system only)
router.post(
  "/auto-confirm",
  authorize("admin"),
  acknowledgmentController.autoConfirmDeliveries,
);

module.exports = router;
