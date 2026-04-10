const adminService = require("../services/admin.service");
const sellerService = require("../services/seller.service");
const { DeliveryHub, Driver, Delivery, User, Seller, Order, OrderItem, Product, Address } = require("../models");
const { sequelize } = require("../config/database");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");

// Get all pending sellers
exports.getPendingSellers = async (req, res) => {
  try {
    const sellers = await adminService.getPendingSellers();

    res.status(200).json({
      success: true,
      data: sellers,
    });
  } catch (error) {
    console.error("Get pending sellers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pending sellers",
      error: error.message,
    });
  }
};

// Approve seller
exports.approveSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await sellerService.findSellerById(sellerId, true);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    if (seller.approvalStatus === "approved") {
      return res.status(400).json({
        success: false,
        message: "Seller is already approved",
      });
    }

    const updated = await adminService.approveSeller(seller, req.user.id);

    res.status(200).json({
      success: true,
      message: "Seller approved successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Approve seller error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve seller",
      error: error.message,
    });
  }
};

// Reject seller
exports.rejectSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const seller = await sellerService.findSellerById(sellerId, true);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    const updated = await adminService.rejectSeller(seller, reason);

    res.status(200).json({
      success: true,
      message: "Seller rejected",
      data: updated,
    });
  } catch (error) {
    console.error("Reject seller error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject seller",
      error: error.message,
    });
  }
};

// Get all sellers (approved, pending, rejected)
exports.getAllSellers = async (req, res) => {
  try {
    const { status } = req.query;

    const sellers = await adminService.getAllSellers(status);

    res.status(200).json({
      success: true,
      data: sellers,
    });
  } catch (error) {
    console.error("Get all sellers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sellers",
      error: error.message,
    });
  }
};

// ============ SELLER MONITORING ============

// Get seller detail with stats
exports.getSellerDetail = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = await Seller.findByPk(sellerId, {
      include: [{ model: User, as: "user", attributes: ["id", "email", "isActive", "createdAt", "lastLogin"] }],
    });
    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });

    const productCount = await Product.count({ where: { sellerId } });
    const orderItems = await OrderItem.findAll({ where: { sellerId }, attributes: ["orderId"] });
    const orderIds = [...new Set(orderItems.map(i => i.orderId))];
    const totalOrders = orderIds.length;
    let totalRevenue = 0;
    if (orderIds.length > 0) {
      const orders = await Order.findAll({ where: { id: { [Op.in]: orderIds }, status: { [Op.ne]: "cancelled" } } });
      // Sum seller items only
      for (const o of orders) {
        const items = await OrderItem.findAll({ where: { orderId: o.id, sellerId } });
        totalRevenue += items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
      }
    }

    res.json({
      success: true,
      data: { ...seller.toJSON(), stats: { productCount, totalOrders, totalRevenue } },
    });
  } catch (error) {
    console.error("Get seller detail error:", error);
    res.status(500).json({ success: false, message: "Failed to get seller detail" });
  }
};

// Toggle seller active/inactive
exports.toggleSellerStatus = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = await Seller.findByPk(sellerId, {
      include: [{ model: User, as: "user" }],
    });
    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });

    const user = await User.findByPk(seller.userId);
    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, message: `Seller ${user.isActive ? "activated" : "deactivated"}`, data: { isActive: user.isActive } });
  } catch (error) {
    console.error("Toggle seller status error:", error);
    res.status(500).json({ success: false, message: "Failed to toggle seller status" });
  }
};

// ============ HUB MANAGEMENT ============

exports.getHubs = async (req, res) => {
  try {
    const hubs = await DeliveryHub.findAll({
      include: [{ model: Driver, as: "drivers", attributes: ["id", "fullName", "isAvailable"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: hubs });
  } catch (error) {
    console.error("Get hubs error:", error);
    res.status(500).json({ success: false, message: "Failed to get hubs" });
  }
};

exports.createHub = async (req, res) => {
  try {
    const { name, address, city, province, latitude, longitude, phone } = req.body;
    if (!name || !address || !city || !province || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: "Name, address, city, province, latitude, and longitude are required" });
    }
    const hub = await DeliveryHub.create({ name, address, city, province, latitude, longitude, phone });
    res.status(201).json({ success: true, data: hub });
  } catch (error) {
    console.error("Create hub error:", error);
    res.status(500).json({ success: false, message: "Failed to create hub" });
  }
};

exports.updateHub = async (req, res) => {
  try {
    const hub = await DeliveryHub.findByPk(req.params.hubId);
    if (!hub) return res.status(404).json({ success: false, message: "Hub not found" });
    const { name, address, city, province, latitude, longitude, phone, isActive } = req.body;
    await hub.update({ name, address, city, province, latitude, longitude, phone, isActive });
    res.json({ success: true, data: hub });
  } catch (error) {
    console.error("Update hub error:", error);
    res.status(500).json({ success: false, message: "Failed to update hub" });
  }
};

exports.deleteHub = async (req, res) => {
  try {
    const hub = await DeliveryHub.findByPk(req.params.hubId);
    if (!hub) return res.status(404).json({ success: false, message: "Hub not found" });
    const driverCount = await Driver.count({ where: { hubId: hub.id } });
    if (driverCount > 0) {
      return res.status(400).json({ success: false, message: "Cannot delete hub with assigned drivers" });
    }
    await hub.destroy();
    res.json({ success: true, message: "Hub deleted" });
  } catch (error) {
    console.error("Delete hub error:", error);
    res.status(500).json({ success: false, message: "Failed to delete hub" });
  }
};

// ============ DRIVER MANAGEMENT ============

exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.findAll({
      include: [
        { model: User, as: "user", attributes: ["id", "email", "isActive"] },
        { model: DeliveryHub, as: "hub", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: drivers });
  } catch (error) {
    console.error("Get drivers error:", error);
    res.status(500).json({ success: false, message: "Failed to get drivers" });
  }
};

exports.createDriver = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { email, password, fullName, phone, vehicleType, plateNumber, licenseNumber, hubId } = req.body;
    if (!email || !password || !fullName || !phone || !vehicleType || !plateNumber || !licenseNumber) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: "Email already in use" });

    if (hubId) {
      const hub = await DeliveryHub.findByPk(hubId);
      if (!hub) return res.status(404).json({ success: false, message: "Hub not found" });
    }

    const user = await User.create({ email, password, fullName, userType: "driver", emailVerified: true, isActive: true }, { transaction: t });
    const driver = await Driver.create({ userId: user.id, fullName, phone, vehicleType, plateNumber, licenseNumber, hubId: hubId || null }, { transaction: t });
    await t.commit();

    res.status(201).json({ success: true, data: { ...driver.toJSON(), user: { id: user.id, email: user.email } } });
  } catch (error) {
    await t.rollback();
    console.error("Create driver error:", error);
    res.status(500).json({ success: false, message: "Failed to create driver" });
  }
};

exports.updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.driverId);
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });
    const { fullName, phone, vehicleType, plateNumber, licenseNumber, hubId, isActive } = req.body;
    await driver.update({ fullName, phone, vehicleType, plateNumber, licenseNumber, hubId, isActive });
    res.json({ success: true, data: driver });
  } catch (error) {
    console.error("Update driver error:", error);
    res.status(500).json({ success: false, message: "Failed to update driver" });
  }
};

exports.deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.driverId);
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });
    const activeDeliveries = await Delivery.count({ where: { driverId: driver.id, status: { [Op.notIn]: ["delivered", "failed"] } } });
    if (activeDeliveries > 0) {
      return res.status(400).json({ success: false, message: "Cannot delete driver with active deliveries" });
    }
    await User.update({ isActive: false }, { where: { id: driver.userId } });
    await driver.update({ isActive: false });
    res.json({ success: true, message: "Driver deactivated" });
  } catch (error) {
    console.error("Delete driver error:", error);
    res.status(500).json({ success: false, message: "Failed to delete driver" });
  }
};

// ============ ADMIN DASHBOARD STATS ============

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalSellers, pendingSellers, totalOrders, totalDrivers, activeDeliveries, totalHubs] = await Promise.all([
      Seller.count({ where: { approvalStatus: "approved" } }),
      Seller.count({ where: { approvalStatus: "pending" } }),
      Order.count(),
      Driver.count({ where: { isActive: true } }),
      Delivery.count({ where: { status: { [Op.notIn]: ["delivered", "failed"] } } }),
      DeliveryHub.count({ where: { isActive: true } }),
    ]);

    const recentOrders = await Order.findAll({
      include: [
        { model: User, as: "user", attributes: ["id", "fullName", "email"] },
        { model: Delivery, as: "delivery", include: [{ model: Driver, as: "driver", attributes: ["id", "fullName"] }] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    res.json({
      success: true,
      data: {
        stats: { totalSellers, pendingSellers, totalOrders, totalDrivers, activeDeliveries, totalHubs },
        recentOrders,
      },
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    res.status(500).json({ success: false, message: "Failed to get dashboard stats" });
  }
};

// ============ ALL DELIVERIES OVERVIEW ============

exports.getAllDeliveries = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status && status !== "all") where.status = status;

    const deliveries = await Delivery.findAll({
      where,
      include: [
        { model: Order, as: "order", include: [{ model: User, as: "user", attributes: ["id", "fullName", "email"] }, { model: Address, as: "address" }] },
        { model: Driver, as: "driver", attributes: ["id", "fullName", "phone", "vehicleType", "currentLatitude", "currentLongitude"] },
        { model: DeliveryHub, as: "hub", attributes: ["id", "name", "address", "latitude", "longitude"] },
        { model: DeliveryHub, as: "destinationHub", attributes: ["id", "name", "address", "latitude", "longitude"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: deliveries });
  } catch (error) {
    console.error("Get all deliveries error:", error);
    res.status(500).json({ success: false, message: "Failed to get deliveries" });
  }
};

module.exports = exports;
