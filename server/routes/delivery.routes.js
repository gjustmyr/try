const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/delivery.controller");
const { authenticate, authorize } = require("../middleware/auth");

// Public tracking endpoint (authenticated user can track their order)
router.get("/track", authenticate, deliveryController.getTracking);

// Admin-only: assign delivery to driver
router.post("/assign", authenticate, authorize("admin"), deliveryController.assignDelivery);

module.exports = router;
