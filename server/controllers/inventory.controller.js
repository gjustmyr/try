const inventoryService = require("../services/inventory.service");

// Adjust inventory (add/remove stock)
exports.adjustInventory = async (req, res) => {
  try {
    const { productId, quantityChange, type, reason, notes } = req.body;
    const sellerId = req.user.sellerProfile.id;
    const performedBy = req.user.id;

    if (!productId || quantityChange === undefined) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity change are required",
      });
    }

    if (!["restock", "adjustment", "damaged"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid adjustment type",
      });
    }

    const log = await inventoryService.adjustInventory(
      productId,
      sellerId,
      parseInt(quantityChange),
      type,
      reason || "Manual adjustment",
      notes,
      performedBy,
    );

    res.json({
      success: true,
      message: "Inventory adjusted successfully",
      data: log,
    });
  } catch (error) {
    console.error("Adjust inventory error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to adjust inventory",
    });
  }
};

// Get inventory logs
exports.getInventoryLogs = async (req, res) => {
  try {
    const sellerId = req.user.sellerProfile.id;
    const { productId, type, startDate, endDate, limit } = req.query;

    const logs = await inventoryService.getInventoryLogs(sellerId, {
      productId,
      type,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : 100,
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("Get inventory logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inventory logs",
    });
  }
};

// Get low stock products
exports.getLowStockProducts = async (req, res) => {
  try {
    const sellerId = req.user.sellerProfile.id;
    const threshold = req.query.threshold ? parseInt(req.query.threshold) : 10;

    const products = await inventoryService.getLowStockProducts(
      sellerId,
      threshold,
    );

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Get low stock products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch low stock products",
    });
  }
};

// Get out of stock products
exports.getOutOfStockProducts = async (req, res) => {
  try {
    const sellerId = req.user.sellerProfile.id;

    const products = await inventoryService.getOutOfStockProducts(sellerId);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Get out of stock products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch out of stock products",
    });
  }
};

// Get inventory summary
exports.getInventorySummary = async (req, res) => {
  try {
    const sellerId = req.user.sellerProfile.id;

    const summary = await inventoryService.getInventorySummary(sellerId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Get inventory summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inventory summary",
    });
  }
};

// Bulk restock
exports.bulkRestock = async (req, res) => {
  try {
    const { items } = req.body;
    const sellerId = req.user.sellerProfile.id;
    const performedBy = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required",
      });
    }

    const results = await inventoryService.bulkRestock(
      sellerId,
      items,
      performedBy,
    );

    res.json({
      success: true,
      message: `Successfully restocked ${results.length} products`,
      data: results,
    });
  } catch (error) {
    console.error("Bulk restock error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restock products",
    });
  }
};

module.exports = exports;
