const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { authenticate, authorize } = require("../middleware/auth");

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize("admin"));

// Dashboard
router.get("/dashboard", adminController.getDashboardStats);

// Seller management
router.get("/sellers/pending", adminController.getPendingSellers);
router.get("/sellers", adminController.getAllSellers);
router.get("/sellers/:sellerId", adminController.getSellerDetail);
router.put("/sellers/:sellerId/approve", adminController.approveSeller);
router.put("/sellers/:sellerId/reject", adminController.rejectSeller);
router.put("/sellers/:sellerId/toggle-status", adminController.toggleSellerStatus);

// Hub management
router.get("/hubs", adminController.getHubs);
router.post("/hubs", adminController.createHub);
router.put("/hubs/:hubId", adminController.updateHub);
router.delete("/hubs/:hubId", adminController.deleteHub);

// Driver management
router.get("/drivers", adminController.getDrivers);
router.post("/drivers", adminController.createDriver);
router.put("/drivers/:driverId", adminController.updateDriver);
router.delete("/drivers/:driverId", adminController.deleteDriver);

// Deliveries
router.get("/deliveries", adminController.getAllDeliveries);

module.exports = router;
