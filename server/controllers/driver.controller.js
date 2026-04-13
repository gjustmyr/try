const {
  Driver,
  Delivery,
  Order,
  OrderItem,
  Address,
  User,
  DeliveryHub,
} = require("../models");
const { Op } = require("sequelize");
const crypto = require("crypto");
const { sendOrderNotification } = require("../utils/notification");

// Get driver profile
exports.getProfile = async (req, res) => {
  try {
    const driver = await Driver.findOne({
      where: { userId: req.user.id },
      include: [
        {
          model: DeliveryHub,
          as: "hub",
          attributes: ["id", "name", "address", "latitude", "longitude"],
        },
      ],
    });
    if (!driver)
      return res
        .status(404)
        .json({ success: false, message: "Driver profile not found" });
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
    if (!driver)
      return res
        .status(404)
        .json({ success: false, message: "Driver not found" });

    const { status } = req.query;
    const where = { driverId: driver.id };
    if (status && status !== "all") where.status = status;

    const deliveries = await Delivery.findAll({
      where,
      include: [
        {
          model: Order,
          as: "order",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "fullName", "email"],
            },
            { model: Address, as: "address" },
            { model: OrderItem, as: "items" },
          ],
        },
        {
          model: DeliveryHub,
          as: "hub",
          attributes: ["id", "name", "address", "latitude", "longitude"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: deliveries });
  } catch (error) {
    console.error("Get my deliveries error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get deliveries" });
  }
};

// Update delivery status (driver picks up, starts transit, delivers)
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver)
      return res
        .status(404)
        .json({ success: false, message: "Driver not found" });

    const delivery = await Delivery.findOne({
      where: { id: req.params.deliveryId, driverId: driver.id },
      include: [
        { model: Order, as: "order" },
        { model: DeliveryHub, as: "destinationHub" },
      ],
    });
    if (!delivery)
      return res
        .status(404)
        .json({ success: false, message: "Delivery not found" });

    const { status, notes } = req.body;

    // Define valid transitions for all delivery statuses
    const validTransitions = {
      pending_drop_off: ["received_at_hub", "failed"],
      received_at_hub: ["in_transit", "failed"],
      in_transit: ["pending_hub_confirmation", "at_destination_hub", "failed"],
      pending_hub_confirmation: ["at_destination_hub", "failed"],
      at_destination_hub: ["out_for_delivery", "failed"],
      out_for_delivery: ["delivered", "failed"],
      assigned: ["picked_up", "in_transit", "out_for_delivery", "failed"],
      picked_up: ["in_transit", "out_for_delivery", "delivered", "failed"],
    };

    if (!validTransitions[delivery.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change from ${delivery.status} to ${status}. Valid transitions: ${validTransitions[delivery.status]?.join(", ") || "none"}`,
      });
    }

    const updates = { status };

    if (status === "picked_up") {
      updates.pickedUpAt = new Date();
      const eta = await calculateETA(delivery.distanceKm, driver.id);
      updates.estimatedDelivery = eta;
      await delivery.order.update({
        status: "shipped",
        estimatedDelivery: eta,
      });
    } else if (status === "in_transit") {
      // Driver is now in transit
      if (!delivery.pickedUpAt) {
        updates.pickedUpAt = new Date();
      }
      const eta = await calculateETA(delivery.distanceKm, driver.id);
      updates.estimatedDelivery = eta;
      await delivery.order.update({
        status: "shipped",
        estimatedDelivery: eta,
      });
    } else if (status === "out_for_delivery") {
      // Driver is now out for final delivery to customer
      const eta = await calculateETA(delivery.distanceKm, driver.id);
      updates.estimatedDelivery = eta;
      await delivery.order.update({
        status: "shipped",
        estimatedDelivery: eta,
      });
    } else if (
      status === "pending_hub_confirmation" ||
      status === "at_destination_hub"
    ) {
      // Driver reports arrival at destination hub
      updates.notes = notes || "Driver arrived at destination hub";
      if (status === "at_destination_hub") {
        await driver.update({ isAvailable: true });
      }
    } else if (status === "delivered") {
      updates.deliveredAt = new Date();
      await delivery.order.update({
        status: "delivered",
        estimatedDelivery: null,
      });
      await driver.update({ isAvailable: true });
    } else if (status === "failed") {
      updates.notes = notes || "Delivery failed";
      await driver.update({ isAvailable: true });
    }

    if (notes && status !== "failed") {
      updates.notes = notes;
    }

    await delivery.update(updates);

    // Send notifications for delivery status changes
    const notificationMap = {
      picked_up: "delivery_picked_up",
      in_transit: "delivery_in_transit",
      out_for_delivery: "delivery_out_for_delivery",
      at_destination_hub: "delivery_at_hub",
      delivered: "order_delivered",
    };

    if (notificationMap[status]) {
      await sendOrderNotification(
        delivery.order.userId,
        delivery.orderId,
        notificationMap[status],
        delivery.order.orderNumber,
        {
          trackingNumber: delivery.trackingNumber,
          hubName: delivery.destinationHub?.name,
        },
      );
    }

    res.json({
      success: true,
      message: "Delivery status updated",
      data: delivery,
    });
  } catch (error) {
    console.error("Update delivery status error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update delivery status" });
  }
};

// Scan QR code to confirm delivery
exports.scanDelivery = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver)
      return res
        .status(404)
        .json({ success: false, message: "Driver not found" });

    const { qrData } = req.body;
    if (!qrData)
      return res
        .status(400)
        .json({ success: false, message: "QR data is required" });

    let parsed;
    try {
      parsed = JSON.parse(qrData);
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid QR code data" });
    }

    const { deliveryId, trackingNumber, secret } = parsed;
    if (!deliveryId || !trackingNumber || !secret) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid QR code format" });
    }

    const delivery = await Delivery.findOne({
      where: { id: deliveryId, driverId: driver.id },
      include: [{ model: Order, as: "order" }],
    });
    if (!delivery)
      return res.status(404).json({
        success: false,
        message: "Delivery not found or not assigned to you",
      });

    if (delivery.status !== "out_for_delivery") {
      return res.status(400).json({
        success: false,
        message: "Delivery must be out_for_delivery to scan",
      });
    }

    // Verify QR secret
    if (
      delivery.qrSecret !== secret ||
      delivery.trackingNumber !== trackingNumber
    ) {
      return res
        .status(400)
        .json({ success: false, message: "QR code verification failed" });
    }

    // Mark as delivered (pending customer acknowledgment)
    await delivery.update({
      status: "delivered",
      deliveredAt: new Date(),
    });

    await delivery.order.update({
      status: "delivered",
      estimatedDelivery: null,
    });

    await driver.update({ isAvailable: true });

    res.json({
      success: true,
      message:
        "Delivery confirmed via QR scan! Waiting for customer acknowledgment.",
      data: { deliveryId: delivery.id, trackingNumber },
    });
  } catch (error) {
    console.error("Scan delivery error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to process QR scan" });
  }
};

// Update driver location (called periodically during delivery)
// Recalculates ETA dynamically based on remaining distance
exports.updateLocation = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver)
      return res
        .status(404)
        .json({ success: false, message: "Driver not found" });

    const { latitude, longitude } = req.body;
    if (!latitude || !longitude)
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });

    await driver.update({
      currentLatitude: latitude,
      currentLongitude: longitude,
    });

    // Find any active delivery for this driver
    const activeDelivery = await Delivery.findOne({
      where: {
        driverId: driver.id,
        status: { [Op.in]: ["picked_up", "in_transit", "out_for_delivery"] },
      },
      include: [
        { model: DeliveryHub, as: "destinationHub" },
        { model: Order, as: "order" },
      ],
    });

    if (activeDelivery) {
      // Update delivery's current location
      await activeDelivery.update({
        currentLatitude: latitude,
        currentLongitude: longitude,
      });

      // Determine destination based on delivery status
      let destLat, destLng;
      if (activeDelivery.status === "in_transit") {
        // Hub-to-hub transfer: destination is the destination hub
        destLat = activeDelivery.destinationHub?.latitude;
        destLng = activeDelivery.destinationHub?.longitude;
      } else {
        // Last-mile delivery: destination is customer address
        destLat = activeDelivery.destinationLatitude;
        destLng = activeDelivery.destinationLongitude;
      }

      if (destLat && destLng) {
        // Calculate remaining distance using Haversine
        const remainingKm = haversineDistance(
          latitude,
          longitude,
          destLat,
          destLng,
        );

        // Dynamic ETA calculation based on delivery type
        let avgSpeedKmh, baseHandlingMinutes;
        if (activeDelivery.status === "in_transit") {
          // Hub-to-hub transfer: faster speed (highways)
          avgSpeedKmh = 40;
          baseHandlingMinutes = 10;
        } else {
          // Last-mile delivery: slower speed (city streets)
          avgSpeedKmh = 30;
          baseHandlingMinutes = 15; // Time to find customer, handover
        }

        const travelHours = remainingKm / avgSpeedKmh;
        const totalMinutes = baseHandlingMinutes + travelHours * 60;

        const newEta = new Date();
        newEta.setTime(newEta.getTime() + totalMinutes * 60 * 1000);

        // Update delivery ETA and distance
        await activeDelivery.update({
          estimatedDelivery: newEta,
          distanceKm: remainingKm,
        });

        // Update order ETA as well
        if (activeDelivery.order) {
          await activeDelivery.order.update({ estimatedDelivery: newEta });
        }

        console.log(
          `[LOCATION UPDATE] Driver ${driver.id} at [${latitude}, ${longitude}] - Remaining: ${remainingKm.toFixed(2)}km, ETA: ${newEta.toISOString()}`,
        );

        return res.json({
          success: true,
          message: "Location and ETA updated",
          data: {
            remainingDistance: remainingKm,
            estimatedDelivery: newEta,
            deliveryId: activeDelivery.id,
          },
        });
      }
    }

    res.json({ success: true, message: "Location updated" });
  } catch (error) {
    console.error("Update location error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update location" });
  }
};

// Toggle availability
exports.toggleAvailability = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver)
      return res
        .status(404)
        .json({ success: false, message: "Driver not found" });
    driver.isAvailable = !driver.isAvailable;
    await driver.save();
    res.json({ success: true, data: { isAvailable: driver.isAvailable } });
  } catch (error) {
    console.error("Toggle availability error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to toggle availability" });
  }
};

// Get driver stats
exports.getStats = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver)
      return res
        .status(404)
        .json({ success: false, message: "Driver not found" });

    const [totalDeliveries, completedToday, activeNow, pendingPickup] =
      await Promise.all([
        Delivery.count({ where: { driverId: driver.id, status: "delivered" } }),
        Delivery.count({
          where: {
            driverId: driver.id,
            status: "delivered",
            deliveredAt: {
              [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        Delivery.count({
          where: {
            driverId: driver.id,
            status: {
              [Op.in]: ["picked_up", "in_transit", "out_for_delivery"],
            },
          },
        }),
        Delivery.count({ where: { driverId: driver.id, status: "assigned" } }),
      ]);

    res.json({
      success: true,
      data: { totalDeliveries, completedToday, activeNow, pendingPickup },
    });
  } catch (error) {
    console.error("Get driver stats error:", error);
    res.status(500).json({ success: false, message: "Failed to get stats" });
  }
};

// Report arrival at destination hub (for hub-to-hub transfers)
exports.reportHubArrival = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver)
      return res
        .status(404)
        .json({ success: false, message: "Driver not found" });

    const { deliveryId } = req.params;

    const delivery = await Delivery.findOne({
      where: { id: deliveryId, driverId: driver.id },
      include: [{ model: DeliveryHub, as: "destinationHub" }],
    });

    if (!delivery)
      return res.status(404).json({
        success: false,
        message: "Delivery not found or not assigned to you",
      });

    if (delivery.status !== "in_transit") {
      return res.status(400).json({
        success: false,
        message: "Delivery must be in_transit to report arrival",
      });
    }

    // Driver reports arrival, but hub must confirm
    await delivery.update({
      status: "pending_hub_confirmation",
      notes: `Driver arrived at ${delivery.destinationHub?.name || "destination hub"}. Awaiting hub confirmation.`,
    });

    res.json({
      success: true,
      message:
        "Arrival reported. Please wait for destination hub to confirm receipt.",
      data: {
        deliveryId: delivery.id,
        status: "pending_hub_confirmation",
        destinationHub: delivery.destinationHub?.name,
      },
    });
  } catch (error) {
    console.error("Report hub arrival error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to report arrival" });
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
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate ETA: considers multiple deliveries in queue
// Assumes average speed of 30 km/h for local delivery
// plus time per delivery stop (15 mins per parcel)
async function calculateETA(
  distanceKm,
  driverId = null,
  currentDeliveryId = null,
) {
  const avgSpeedKmh = 30;
  const timePerStopMinutes = 15; // Time to find customer, hand over parcel, get signature
  const baseHandlingMinutes = 10; // Base handling time

  let totalMinutes = baseHandlingMinutes;

  // If driver is provided, check how many OTHER pending deliveries they have
  if (driverId) {
    try {
      const { Delivery } = require("../models");
      const { Op } = require("sequelize");

      const where = {
        driverId,
        status: ["assigned", "picked_up", "in_transit"],
      };

      // Exclude current delivery if provided
      if (currentDeliveryId) {
        where.id = { [Op.ne]: currentDeliveryId };
      }

      const pendingDeliveries = await Delivery.count({ where });

      // Add time for each OTHER pending delivery stop
      // Each stop takes time to park, find customer, hand over, get signature
      totalMinutes += pendingDeliveries * timePerStopMinutes;
    } catch (error) {
      console.error("Error calculating pending deliveries:", error);
      // Continue with basic calculation if query fails
    }
  }

  // Add travel time based on distance
  const travelHours = (distanceKm || 10) / avgSpeedKmh;
  totalMinutes += travelHours * 60;

  // Create ETA date
  const eta = new Date();
  eta.setTime(eta.getTime() + totalMinutes * 60 * 1000);
  return eta;
}

module.exports = exports;
