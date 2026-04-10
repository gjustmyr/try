const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.post("/", orderController.placeOrder);
router.get("/", orderController.getOrders);
router.get("/seller", orderController.getSellerOrders);
router.put("/:orderId/status", orderController.updateOrderStatus);
router.get("/:orderId", orderController.getOrder);

module.exports = router;
