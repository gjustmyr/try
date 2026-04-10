const { Delivery, Driver, Order, OrderItem, Address, User, DeliveryHub, Seller } = require("../models");
const { sequelize } = require("../config/database");
const { Op } = require("sequelize");
const QRCode = require("qrcode");
const crypto = require("crypto");

// Haversine formula
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

// Find nearest hub to given coordinates
function findNearestHub(hubs, lat, lng) {
  let nearest = null;
  let minDist = Infinity;
  for (const hub of hubs) {
    if (!hub.isActive) continue;
    const dist = haversineDistance(lat, lng, hub.latitude, hub.longitude);
    if (dist < minDist) {
      minDist = dist;
      nearest = hub;
    }
  }
  return nearest;
}

// ============ SELLER DROP-OFF ============

// Seller initiates drop-off at hub (creates Delivery with pending_drop_off)
exports.sellerDropOff = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { orderId, hubId } = req.body;
    if (!orderId || !hubId) {
      return res.status(400).json({ success: false, message: "orderId and hubId are required" });
    }

    // Verify seller owns items in this order
    const seller = await Seller.findOne({ where: { userId: req.user.id } });
    if (!seller) return res.status(403).json({ success: false, message: "Seller not found" });

    const hasItems = await OrderItem.findOne({ where: { orderId, sellerId: seller.id } });
    if (!hasItems) return res.status(404).json({ success: false, message: "Order not found" });

    const order = await Order.findByPk(orderId, {
      include: [{ model: Address, as: "address" }],
    });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status !== "processing") {
      return res.status(400).json({ success: false, message: "Order must be in 'processing' status to drop off at hub" });
    }

    // Check no existing delivery
    const existingDelivery = await Delivery.findOne({ where: { orderId } });
    if (existingDelivery) return res.status(400).json({ success: false, message: "Order already has a delivery record" });

    const originHub = await DeliveryHub.findByPk(hubId);
    if (!originHub) return res.status(404).json({ success: false, message: "Hub not found" });

    // Find destination hub (nearest to customer address)
    let destinationHubId = null;
    if (order.address?.latitude && order.address?.longitude) {
      const allHubs = await DeliveryHub.findAll({ where: { isActive: true } });
      const destHub = findNearestHub(
        allHubs.filter(h => h.id !== originHub.id),
        order.address.latitude,
        order.address.longitude
      );
      if (destHub) destinationHubId = destHub.id;
    }
    // If no other hub found or same city, use origin hub as destination too
    if (!destinationHubId) destinationHubId = originHub.id;

    const destAddr = order.address
      ? `${order.address.streetAddress}, ${order.address.barangay}, ${order.address.city}, ${order.address.province}`
      : "";

    const delivery = await Delivery.create({
      orderId,
      hubId: originHub.id,
      destinationHubId,
      status: "pending_drop_off",
      destinationLatitude: order.address?.latitude || null,
      destinationLongitude: order.address?.longitude || null,
      destinationAddress: destAddr,
      currentLatitude: originHub.latitude,
      currentLongitude: originHub.longitude,
    }, { transaction: t });

    await t.commit();

    res.status(201).json({ success: true, message: "Drop-off initiated. Bring your parcel to the hub.", data: delivery });
  } catch (error) {
    await t.rollback();
    console.error("Seller drop-off error:", error);
    res.status(500).json({ success: false, message: "Failed to initiate drop-off" });
  }
};

// Get hubs for seller to choose from (public, active hubs)
exports.getAvailableHubs = async (req, res) => {
  try {
    const hubs = await DeliveryHub.findAll({
      where: { isActive: true },
      attributes: ["id", "name", "address", "city", "province", "latitude", "longitude", "phone"],
      order: [["name", "ASC"]],
    });
    res.json({ success: true, data: hubs });
  } catch (error) {
    console.error("Get available hubs error:", error);
    res.status(500).json({ success: false, message: "Failed to get hubs" });
  }
};

// ============ HUB OPERATIONS (Admin) ============

// Get parcels at a hub (by status)
exports.getHubParcels = async (req, res) => {
  try {
    const { hubId } = req.params;
    const { status } = req.query;

    const hub = await DeliveryHub.findByPk(hubId);
    if (!hub) return res.status(404).json({ success: false, message: "Hub not found" });

    // Show parcels where this hub is origin OR destination
    const where = {
      [Op.or]: [{ hubId }, { destinationHubId: hubId }],
    };
    if (status && status !== "all") where.status = status;

    const parcels = await Delivery.findAll({
      where,
      include: [
        {
          model: Order, as: "order",
          include: [
            { model: User, as: "user", attributes: ["id", "fullName", "email"] },
            { model: Address, as: "address" },
            { model: OrderItem, as: "items", include: [{ model: Seller, as: "seller", attributes: ["id", "shopName"] }] },
          ],
        },
        { model: Driver, as: "driver", attributes: ["id", "fullName", "phone", "vehicleType"] },
        { model: DeliveryHub, as: "hub", attributes: ["id", "name", "address"] },
        { model: DeliveryHub, as: "destinationHub", attributes: ["id", "name", "address"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, data: parcels });
  } catch (error) {
    console.error("Get hub parcels error:", error);
    res.status(500).json({ success: false, message: "Failed to get hub parcels" });
  }
};

// Hub receives parcel from seller → generates tracking # + QR code
exports.receiveParcel = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findByPk(deliveryId, {
      include: [{ model: Order, as: "order" }],
    });
    if (!delivery) return res.status(404).json({ success: false, message: "Delivery not found" });

    if (delivery.status !== "pending_drop_off") {
      return res.status(400).json({ success: false, message: "Parcel is not in pending_drop_off status" });
    }

    // Generate tracking number
    const trackingNumber = "TRK-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

    // Generate QR secret for verification
    const qrSecret = crypto.randomBytes(16).toString("hex");

    // Generate QR code data
    const qrData = JSON.stringify({
      deliveryId: delivery.id,
      trackingNumber,
      secret: qrSecret,
    });
    const qrCodeImage = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

    // Update delivery
    await delivery.update({
      status: "received_at_hub",
      trackingNumber,
      qrCode: qrCodeImage,
      qrSecret,
    }, { transaction: t });

    // Update order status to shipped + set tracking number
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);
    await delivery.order.update({
      status: "shipped",
      trackingNumber,
      estimatedDelivery,
    }, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: "Parcel received. Tracking number and QR code generated.",
      data: {
        id: delivery.id,
        trackingNumber,
        qrCode: qrCodeImage,
        status: "received_at_hub",
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Receive parcel error:", error);
    res.status(500).json({ success: false, message: "Failed to receive parcel" });
  }
};

// Dispatch parcel to destination hub (assign transfer driver)
exports.dispatchToHub = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { deliveryId } = req.params;
    const { driverId } = req.body;

    const delivery = await Delivery.findByPk(deliveryId, {
      include: [
        { model: DeliveryHub, as: "hub" },
        { model: DeliveryHub, as: "destinationHub" },
      ],
    });
    if (!delivery) return res.status(404).json({ success: false, message: "Delivery not found" });

    if (delivery.status !== "received_at_hub") {
      return res.status(400).json({ success: false, message: "Parcel must be received_at_hub to dispatch" });
    }

    // If origin and destination hub are the same, skip transit
    if (delivery.hubId === delivery.destinationHubId) {
      await delivery.update({ status: "at_destination_hub" }, { transaction: t });
      await t.commit();
      return res.json({ success: true, message: "Same hub — parcel ready for rider assignment.", data: delivery });
    }

    if (!driverId) {
      return res.status(400).json({ success: false, message: "driverId is required for hub-to-hub transfer" });
    }

    const driver = await Driver.findByPk(driverId);
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });
    if (!driver.isAvailable) return res.status(400).json({ success: false, message: "Driver is not available" });

    // Calculate distance between hubs
    const distanceKm = haversineDistance(
      delivery.hub.latitude, delivery.hub.longitude,
      delivery.destinationHub.latitude, delivery.destinationHub.longitude
    );

    await delivery.update({
      status: "in_transit",
      driverId,
      distanceKm,
      currentLatitude: delivery.hub.latitude,
      currentLongitude: delivery.hub.longitude,
    }, { transaction: t });

    await driver.update({ isAvailable: false }, { transaction: t });
    await t.commit();

    res.json({ success: true, message: "Parcel dispatched to destination hub.", data: delivery });
  } catch (error) {
    await t.rollback();
    console.error("Dispatch to hub error:", error);
    res.status(500).json({ success: false, message: "Failed to dispatch parcel" });
  }
};

// Mark parcel as arrived at destination hub
exports.arriveAtHub = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findByPk(deliveryId);
    if (!delivery) return res.status(404).json({ success: false, message: "Delivery not found" });

    if (delivery.status !== "in_transit") {
      return res.status(400).json({ success: false, message: "Parcel must be in_transit to mark as arrived" });
    }

    // Free the transfer driver
    if (delivery.driverId) {
      await Driver.update({ isAvailable: true }, { where: { id: delivery.driverId }, transaction: t });
    }

    await delivery.update({
      status: "at_destination_hub",
      driverId: null,
    }, { transaction: t });

    await t.commit();

    res.json({ success: true, message: "Parcel arrived at destination hub.", data: delivery });
  } catch (error) {
    await t.rollback();
    console.error("Arrive at hub error:", error);
    res.status(500).json({ success: false, message: "Failed to update arrival" });
  }
};

// Assign rider for last-mile delivery
exports.assignRider = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { deliveryId } = req.params;
    const { driverId } = req.body;

    if (!driverId) return res.status(400).json({ success: false, message: "driverId is required" });

    const delivery = await Delivery.findByPk(deliveryId, {
      include: [
        { model: Order, as: "order" },
        { model: DeliveryHub, as: "destinationHub" },
      ],
    });
    if (!delivery) return res.status(404).json({ success: false, message: "Delivery not found" });

    if (delivery.status !== "at_destination_hub") {
      return res.status(400).json({ success: false, message: "Parcel must be at_destination_hub to assign rider" });
    }

    const driver = await Driver.findByPk(driverId);
    if (!driver) return res.status(404).json({ success: false, message: "Rider not found" });
    if (!driver.isAvailable) return res.status(400).json({ success: false, message: "Rider is not available" });

    // Calculate distance from destination hub to customer
    const distanceKm = haversineDistance(
      delivery.destinationHub.latitude, delivery.destinationHub.longitude,
      delivery.destinationLatitude, delivery.destinationLongitude
    );

    // Calculate ETA
    const avgSpeedKmh = 30;
    const handlingHours = 0.5;
    const travelHours = (distanceKm || 5) / avgSpeedKmh;
    const eta = new Date();
    eta.setTime(eta.getTime() + (travelHours + handlingHours) * 60 * 60 * 1000);

    await delivery.update({
      status: "out_for_delivery",
      driverId,
      distanceKm,
      estimatedDelivery: eta,
      currentLatitude: delivery.destinationHub.latitude,
      currentLongitude: delivery.destinationHub.longitude,
    }, { transaction: t });

    // Update order status
    await delivery.order.update({
      status: "out_for_delivery",
      estimatedDelivery: eta,
    }, { transaction: t });

    await driver.update({ isAvailable: false }, { transaction: t });
    await t.commit();

    res.json({ success: true, message: "Rider assigned. Parcel out for delivery.", data: delivery });
  } catch (error) {
    await t.rollback();
    console.error("Assign rider error:", error);
    res.status(500).json({ success: false, message: "Failed to assign rider" });
  }
};

// Get QR code for a delivery (hub staff can print it)
exports.getDeliveryQR = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const delivery = await Delivery.findByPk(deliveryId, {
      attributes: ["id", "trackingNumber", "qrCode", "status"],
    });
    if (!delivery) return res.status(404).json({ success: false, message: "Delivery not found" });
    if (!delivery.qrCode) return res.status(404).json({ success: false, message: "QR code not yet generated" });

    res.json({ success: true, data: { id: delivery.id, trackingNumber: delivery.trackingNumber, qrCode: delivery.qrCode } });
  } catch (error) {
    console.error("Get QR error:", error);
    res.status(500).json({ success: false, message: "Failed to get QR code" });
  }
};

module.exports = exports;
