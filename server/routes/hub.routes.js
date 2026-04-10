const express = require("express");
const router = express.Router();
const hubController = require("../controllers/hub.controller");
const { authenticate, authorize } = require("../middleware/auth");

// Seller endpoints
router.post("/drop-off", authenticate, authorize("seller"), hubController.sellerDropOff);
router.get("/available", authenticate, hubController.getAvailableHubs);

// Admin hub operations
router.get("/:hubId/parcels", authenticate, authorize("admin"), hubController.getHubParcels);
router.put("/parcels/:deliveryId/receive", authenticate, authorize("admin"), hubController.receiveParcel);
router.put("/parcels/:deliveryId/dispatch", authenticate, authorize("admin"), hubController.dispatchToHub);
router.put("/parcels/:deliveryId/arrive", authenticate, authorize("admin"), hubController.arriveAtHub);
router.put("/parcels/:deliveryId/assign-rider", authenticate, authorize("admin"), hubController.assignRider);
router.get("/parcels/:deliveryId/qr", authenticate, hubController.getDeliveryQR);

module.exports = router;
