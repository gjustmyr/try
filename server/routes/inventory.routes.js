const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventory.controller");
const { authenticate, authorize } = require("../middleware/auth");

// All routes require seller authentication
router.use(authenticate, authorize("seller"));

// Adjust inventory (add/remove stock)
router.post("/adjust", inventoryController.adjustInventory);

// Get inventory logs
router.get("/logs", inventoryController.getInventoryLogs);

// Get low stock products
router.get("/low-stock", inventoryController.getLowStockProducts);

// Get out of stock products
router.get("/out-of-stock", inventoryController.getOutOfStockProducts);

// Get inventory summary
router.get("/summary", inventoryController.getInventorySummary);

// Bulk restock
router.post("/bulk-restock", inventoryController.bulkRestock);

module.exports = router;
