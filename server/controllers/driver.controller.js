const { Driver, Delivery, Order, OrderItem, Address, User, DeliveryHub } = require("../models");
const { Op } = require("sequelize");
const crypto = require("crypto");

// Get driver profile
exports.getProfile = async (req, res) => {
  try {
    const driver = await Driver.findOne({
      where: { userId: req.user.id },
      include: [{ model: DeliveryHub, as: "hub", attributes: ["id", "name", "address", "latitude", "longitude"] }],
    });
    if (!driver) return res.status(404).json({ success: false, message: "Driver profile not found" });
    res.json({ success: true, data: driver });
  } catch (error) {
    console.error("Get driver profile error:", error);
    res.status(500).json({ success: false, message: "Failed to get profile" });
  }
};

// Get assigned deliveries
exports.getMyDeliveries = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    const { status } = req.query;
    const where = { driverId: driver.id };
    if (status && status !== "all") where.status = status;

    const deliveries = await Delivery.findAll({
      where,
      include: [
        {
          model: Order, as: "order",
          include: [
            { model: User, as: "user", attributes: ["id", "fullName", "email"] },
            { model: Address, as: "address" },
            { model: OrderItem, as: "items" },
          ],
        },
        { model: DeliveryHub, as: "hub", attributes: ["id", "name", "address", "latitude", "longitude"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: deliveries });
  } catch (error) {
    console.error("Get my deliveries error:", error);
    res.status(500).json({ success: false, message: "Failed to get deliveries" });
  }
};

// Update delivery status (driver picks up, starts transit, delivers)
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    const delivery = await Delivery.findOne({
      where: { id: req.params.deliveryId, driverId: driver.id },
      include: [{ model: Order, as: "order" }],
    });
    if (!delivery) return res.status(404).json({ success: false, message: "Delivery not found" });

    const { status } = req.body;
    const validTransitions = {
      assigned: ["picked_up"],
      picked_up: ["in_transit"],
      in_transit: ["at_destination_hub", "delivered", "failed"],
      out_for_delivery: ["delivered", "failed"],
    };

    if (!validTransitions[delivery.status]?.includes(status)) {
      return res.status(400).json({ success: false, message: `Cannot change from ${delivery.status} to ${status}` });
    }

    const updates = { status };

    if (status === "picked_up") {
      updates.pickedUpAt = new Date();
      const eta = calculateETA(delivery.distanceKm);
      updates.estimatedDelivery = eta;
      await delivery.order.update({ status: "shipped", estimatedDelivery: eta });
    } else if (status === "at_destination_hub") {
      // Transfer driver arrived at destination hub
      await driver.update({ isAvailable: true });
      updates.driverId = null;
    } else if (status === "delivered") {
      updates.deliveredAt = new Date();
      await delivery.order.update({ status: "delivered", estimatedDelivery: null });
      await driver.update({ isAvailable: true });
    } else if (status === "failed") {
      updates.notes = req.body.notes || "Delivery failed";
      await driver.update({ isAvailable: true });
    }

    await delivery.update(updates);

    res.json({ success: true, message: "Delivery status updated", data: delivery });
  } catch (error) {
    console.error("Update delivery status error:", error);
    res.status(500).json({ success: false, message: "Failed to update delivery status" });
  }
};

// Scan QR code to confirm delivery
exports.scanDelivery = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    const { qrData } = req.body;
    if (!qrData) return res.status(400).json({ success: false, message: "QR data is required" });

    let parsed;
    try {
      parsed = JSON.parse(qrData);
    } catch (e) {
      return res.status(400).json({ success: false, message: "Invalid QR code data" });
    }

    const { deliveryId, trackingNumber, secret } = parsed;
    if (!deliveryId || !trackingNumber || !secret) {
      return res.status(400).json({ success: false, message: "Invalid QR code format" });
    }

    const delivery = await Delivery.findOne({
      where: { id: deliveryId, driverId: driver.id },
      include: [{ model: Order, as: "order" }],
    });
    if (!delivery) return res.status(404).json({ success: false, message: "Delivery not found or not assigned to you" });

    if (delivery.status !== "out_for_delivery") {
      return res.status(400).json({ success: false, message: "Delivery must be out_for_delivery to scan" });
    }

    // Verify QR secret
    if (delivery.qrSecret !== secret || delivery.trackingNumber !== trackingNumber) {
      return res.status(400).json({ success: false, message: "QR code verification failed" });
    }

    // Mark as delivered
    await delivery.update({
      status: "delivered",
      deliveredAt: new Date(),
    });

    await delivery.order.update({
      status: "delivered",
      estimatedDelivery: null,
    });

    await driver.update({ isAvailable: true });

    res.json({ success: true, message: "Delivery confirmed via QR scan!", data: { deliveryId: delivery.id, trackingNumber } });
  } catch (error) {
    console.error("Scan delivery error:", error);
    res.status(500).json({ success: false, message: "Failed to process QR scan" });
  }
};

// Update driver location (called periodically during delivery)
exports.updateLocation = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) return res.status(400).json({ success: false, message: "Latitude and longitude are required" });

    await driver.update({ currentLatitude: latitude, currentLongitude: longitude });

    // Also update any active delivery's current location
    const activeDelivery = await Delivery.findOne({
      where: { driverId: driver.id, status: { [Op.in]: ["picked_up", "in_transit"] } },
    });
    if (activeDelivery) {
      await activeDelivery.update({ currentLatitude: latitude, currentLongitude: longitude });

      // Recalculate ETA based on remaining distance
      const remainingKm = haversineDistance(latitude, longitude, activeDelivery.destinationLatitude, activeDelivery.destinationLongitude);
      const newEta = calculateETA(remainingKm);
      await activeDelivery.update({ estimatedDelivery: newEta, distanceKm: remainingKm });
      await activeDelivery.getOrder().then(order => {
        if (order) order.update({ estimatedDelivery: newEta });
      });
    }

    res.json({ success: true, message: "Location updated" });
  } catch (error) {
    console.error("Update location error:", error);
    res.status(500).json({ success: false, message: "Failed to update location" });
  }
};

// Toggle availability
exports.toggleAvailability = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });
    driver.isAvailable = !driver.isAvailable;
    await driver.save();
    res.json({ success: true, data: { isAvailable: driver.isAvailable } });
  } catch (error) {
    console.error("Toggle availability error:", error);
    res.status(500).json({ success: false, message: "Failed to toggle availability" });
  }
};

// Get driver stats
exports.getStats = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    const [totalDeliveries, completedToday, activeNow, pendingPickup] = await Promise.all([
      Delivery.count({ where: { driverId: driver.id, status: "delivered" } }),
      Delivery.count({
        where: {
          driverId: driver.id,
          status: "delivered",
          deliveredAt: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      Delivery.count({ where: { driverId: driver.id, status: { [Op.in]: ["picked_up", "in_transit"] } } }),
      Delivery.count({ where: { driverId: driver.id, status: "assigned" } }),
    ]);

    res.json({ success: true, data: { totalDeliveries, completedToday, activeNow, pendingPickup } });
  } catch (error) {
    console.error("Get driver stats error:", error);
    res.status(500).json({ success: false, message: "Failed to get stats" });
  }
};

// ============ HELPERS ============

// Haversine formula to calculate distance between two points in km
function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate ETA: assumes average speed of 30 km/h for local delivery
// plus 30 mins handling buffer. Returns a Date.
function calculateETA(distanceKm) {
  const avgSpeedKmh = 30;
  const handlingBufferHours = 0.5;
  const travelHours = (distanceKm || 10) / avgSpeedKmh;
  const totalHours = travelHours + handlingBufferHours;
  const eta = new Date();
  eta.setTime(eta.getTime() + totalHours * 60 * 60 * 1000);
  return eta;
}

module.exports = exports;
