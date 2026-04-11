const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { authenticate, authorize } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// Dashboard (admin only)
router.get("/dashboard", authorize("admin"), adminController.getDashboardStats);

// Seller management (admin only)
router.get(
  "/sellers/pending",
  authorize("admin"),
  adminController.getPendingSellers,
);
router.get("/sellers", authorize("admin"), adminController.getAllSellers);
router.get(
  "/sellers/:sellerId",
  authorize("admin"),
  adminController.getSellerDetail,
);
router.put(
  "/sellers/:sellerId/approve",
  authorize("admin"),
  adminController.approveSeller,
);
router.put(
  "/sellers/:sellerId/reject",
  authorize("admin"),
  adminController.rejectSeller,
);
router.put(
  "/sellers/:sellerId/toggle-status",
  authorize("admin"),
  adminController.toggleSellerStatus,
);

// Hub management (admin only)
router.get("/hubs", authorize("admin"), adminController.getHubs);
router.post("/hubs", authorize("admin"), adminController.createHub);
router.put("/hubs/:hubId", authorize("admin"), adminController.updateHub);
router.delete("/hubs/:hubId", authorize("admin"), adminController.deleteHub);

// Driver management - ADMIN: READ-ONLY, HUB: Full CRUD
router.get("/drivers", authorize("admin", "hub"), adminController.getDrivers);
router.post(
  "/drivers",
  authorize("hub"), // Only hub can create drivers
  adminController.createDriver,
);
router.put(
  "/drivers/:driverId",
  authorize("hub"), // Only hub can update drivers
  adminController.updateDriver,
);
router.delete(
  "/drivers/:driverId",
  authorize("hub"), // Only hub can delete drivers
  adminController.deleteDriver,
);

// Deliveries and Orders - ADMIN: READ-ONLY
router.get("/deliveries", authorize("admin"), adminController.getAllDeliveries);
router.get("/orders/search", authorize("admin"), adminController.searchOrders);

module.exports = router;
