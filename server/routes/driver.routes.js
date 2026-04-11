const express = require("express");
const router = express.Router();
const driverController = require("../controllers/driver.controller");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);
router.use(authorize("driver"));

router.get("/profile", driverController.getProfile);
router.get("/stats", driverController.getStats);
router.get("/deliveries", driverController.getMyDeliveries);
router.put(
	"/deliveries/:deliveryId/status",
	driverController.updateDeliveryStatus,
);
router.post("/scan-delivery", driverController.scanDelivery);
router.put("/location", driverController.updateLocation);
router.put("/availability", driverController.toggleAvailability);

module.exports = router;
