const { Product, InventoryLog, Seller } = require("../models");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");

/**
 * Adjust product inventory
 */
exports.adjustInventory = async (
  productId,
  sellerId,
  quantityChange,
  type,
  reason,
  notes,
  performedBy,
) => {
  const t = await sequelize.transaction();
  try {
    const product = await Product.findOne({
      where: { id: productId, sellerId },
      transaction: t,
    });

    if (!product) {
      await t.rollback();
      throw { status: 404, message: "Product not found" };
    }

    const quantityBefore = product.quantity;
    const quantityAfter = quantityBefore + quantityChange;

    if (quantityAfter < 0) {
      await t.rollback();
      throw {
        status: 400,
        message: "Adjustment would result in negative inventory",
      };
    }

    await product.update({ quantity: quantityAfter }, { transaction: t });

    const log = await InventoryLog.create(
      {
        productId,
        sellerId,
        type,
        quantityBefore,
        quantityChange,
        quantityAfter,
        reason,
        notes,
        performedBy,
      },
      { transaction: t },
    );

    await t.commit();
    return log;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Get inventory logs for a seller
 */
exports.getInventoryLogs = async (sellerId, filters = {}) => {
  const where = { sellerId };

  if (filters.productId) {
    where.productId = filters.productId;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.startDate && filters.endDate) {
    where.createdAt = {
      [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)],
    };
  }

  const logs = await InventoryLog.findAll({
    where,
    include: [
      {
        model: Product,
        as: "product",
        attributes: ["id", "name", "sku", "images"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });

  return logs;
};

/**
 * Get low stock products for a seller
 */
exports.getLowStockProducts = async (sellerId, threshold = 10) => {
  const products = await Product.findAll({
    where: {
      sellerId,
      quantity: {
        [Op.lte]: threshold,
        [Op.gt]: 0,
      },
      status: "active",
    },
    order: [["quantity", "ASC"]],
  });

  return products;
};

/**
 * Get out of stock products for a seller
 */
exports.getOutOfStockProducts = async (sellerId) => {
  const products = await Product.findAll({
    where: {
      sellerId,
      quantity: 0,
      status: "active",
    },
    order: [["updatedAt", "DESC"]],
  });

  return products;
};

/**
 * Get inventory summary for a seller
 */
exports.getInventorySummary = async (sellerId) => {
  const [totalProducts, lowStock, outOfStock, totalValue] = await Promise.all([
    Product.count({
      where: { sellerId, status: "active" },
    }),
    Product.count({
      where: {
        sellerId,
        quantity: { [Op.lte]: 10, [Op.gt]: 0 },
        status: "active",
      },
    }),
    Product.count({
      where: { sellerId, quantity: 0, status: "active" },
    }),
    Product.sum("quantity", {
      where: { sellerId, status: "active" },
    }),
  ]);

  // Get recent inventory movements (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentLogs = await InventoryLog.findAll({
    where: {
      sellerId,
      createdAt: { [Op.gte]: thirtyDaysAgo },
    },
    attributes: [
      "type",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      [sequelize.fn("SUM", sequelize.col("quantity_change")), "totalChange"],
    ],
    group: ["type"],
  });

  return {
    totalProducts: totalProducts || 0,
    lowStockCount: lowStock || 0,
    outOfStockCount: outOfStock || 0,
    totalInventoryUnits: totalValue || 0,
    recentMovements: recentLogs,
  };
};

/**
 * Bulk restock products
 */
exports.bulkRestock = async (sellerId, items, performedBy) => {
  const t = await sequelize.transaction();
  try {
    const results = [];

    for (const item of items) {
      const { productId, quantity, notes } = item;

      const product = await Product.findOne({
        where: { id: productId, sellerId },
        transaction: t,
      });

      if (!product) {
        continue; // Skip invalid products
      }

      const quantityBefore = product.quantity;
      const quantityChange = quantity;
      const quantityAfter = quantityBefore + quantityChange;

      await product.update({ quantity: quantityAfter }, { transaction: t });

      const log = await InventoryLog.create(
        {
          productId,
          sellerId,
          type: "restock",
          quantityBefore,
          quantityChange,
          quantityAfter,
          reason: "Bulk restock",
          notes,
          performedBy,
        },
        { transaction: t },
      );

      results.push(log);
    }

    await t.commit();
    return results;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

module.exports = exports;
