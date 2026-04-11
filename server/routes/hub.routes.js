const express = require("express");
const router = express.Router();
const hubController = require("../controllers/hub.controller");
const { authenticate, authorize } = require("../middleware/auth");

// Public hub list
router.get("/available", authenticate, hubController.getAvailableHubs);

// Hub operations (accessible by admin and hub users)
router.get(
  "/orders/search",
  authenticate,
  authorize("admin", "hub"),
  hubController.searchProcessingOrders,
);
router.post(
  "/:hubId/receive-order",
  authenticate,
  authorize("admin", "hub"),
  hubController.receiveFromSeller,
);
router.get(
  "/:hubId/parcels",
  authenticate,
  authorize("admin", "hub"),
  hubController.getHubParcels,
);
router.put(
  "/parcels/:deliveryId/dispatch",
  authenticate,
  authorize("admin", "hub"),
  hubController.dispatchToHub,
);
router.put(
  "/parcels/:deliveryId/arrive",
  authenticate,
  authorize("admin", "hub"),
  hubController.arriveAtHub,
);
router.put(
  "/parcels/:deliveryId/assign-rider",
  authenticate,
  authorize("admin", "hub"),
  hubController.assignRider,
);
router.get(
  "/parcels/:deliveryId/qr",
  authenticate,
  authorize("admin", "hub"),
  hubController.getDeliveryQR,
);
router.post(
  "/parcels/:deliveryId/regenerate-qr",
  authenticate,
  authorize("admin", "hub"),
  hubController.regenerateQR,
);

module.exports = router;
