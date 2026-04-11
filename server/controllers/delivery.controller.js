const {
	Delivery,
	Driver,
	Order,
	OrderItem,
	Address,
	User,
	DeliveryHub,
} = require("../models");
const { sequelize } = require("../config/database");
const { Op } = require("sequelize");

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

// Assign delivery to a driver (admin or system action)
exports.assignDelivery = async (req, res) => {
	const t = await sequelize.transaction();
	try {
		const { orderId, driverId, hubId } = req.body;
		if (!orderId || !driverId || !hubId) {
			return res
				.status(400)
				.json({
					success: false,
					message: "orderId, driverId, and hubId are required",
				});
		}

		const order = await Order.findByPk(orderId, {
			include: [{ model: Address, as: "address" }],
		});
		if (!order)
			return res
				.status(404)
				.json({ success: false, message: "Order not found" });

		// Check order isn't already assigned
		const existingDelivery = await Delivery.findOne({ where: { orderId } });
		if (existingDelivery)
			return res
				.status(400)
				.json({
					success: false,
					message: "Order already has a delivery assignment",
				});

		const driver = await Driver.findByPk(driverId);
		if (!driver)
			return res
				.status(404)
				.json({ success: false, message: "Driver not found" });
		if (!driver.isAvailable)
			return res
				.status(400)
				.json({ success: false, message: "Driver is not available" });

		const hub = await DeliveryHub.findByPk(hubId);
		if (!hub)
			return res.status(404).json({ success: false, message: "Hub not found" });

		// Calculate distance from hub to delivery address
		const destLat = order.address?.latitude;
		const destLng = order.address?.longitude;
		const distanceKm = haversineDistance(
			hub.latitude,
			hub.longitude,
			destLat,
			destLng,
		);

		const trackingNumber =
			"TRK-" +
			Date.now().toString(36).toUpperCase() +
			Math.random().toString(36).substring(2, 5).toUpperCase();

		const destAddr = order.address
			? `${order.address.streetAddress}, ${order.address.barangay}, ${order.address.city}, ${order.address.province}`
			: "";

		const delivery = await Delivery.create(
			{
				orderId,
				driverId,
				hubId,
				trackingNumber,
				status: "assigned",
				destinationLatitude: destLat,
				destinationLongitude: destLng,
				destinationAddress: destAddr,
				distanceKm,
				currentLatitude: hub.latitude,
				currentLongitude: hub.longitude,
			},
			{ transaction: t },
		);

		// Mark driver as busy
		await driver.update({ isAvailable: false }, { transaction: t });

		// Update order status to processing (ready for pickup)
		if (order.status === "pending" || order.status === "confirmed") {
			await order.update({ status: "processing" }, { transaction: t });
		}

		await t.commit();

		res.status(201).json({ success: true, data: delivery });
	} catch (error) {
		await t.rollback();
		console.error("Assign delivery error:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to assign delivery" });
	}
};

// Get tracking info (public — by tracking number or orderId)
exports.getTracking = async (req, res) => {
	try {
		const { trackingNumber, orderId } = req.query;
		const where = {};
		if (trackingNumber) where.trackingNumber = trackingNumber;
		else if (orderId) where.orderId = orderId;
		else
			return res
				.status(400)
				.json({
					success: false,
					message: "trackingNumber or orderId required",
				});

		const delivery = await Delivery.findOne({
			where,
			include: [
				{
					model: Order,
					as: "order",
					attributes: [
						"id",
						"orderNumber",
						"status",
						"total",
						"estimatedDelivery",
						"createdAt",
					],
					include: [
						{
							model: Address,
							as: "address",
							attributes: [
								"fullName",
								"phone",
								"streetAddress",
								"barangay",
								"city",
								"province",
								"latitude",
								"longitude",
							],
						},
					],
				},
				{
					model: Driver,
					as: "driver",
					attributes: [
						"id",
						"fullName",
						"phone",
						"vehicleType",
						"plateNumber",
						"currentLatitude",
						"currentLongitude",
					],
				},
				{
					model: DeliveryHub,
					as: "hub",
					attributes: ["id", "name", "address", "city", "province", "latitude", "longitude"],
				},
				{
					model: DeliveryHub,
					as: "destinationHub",
					attributes: ["id", "name", "address", "city", "province", "latitude", "longitude"],
				},
			],
		});

		if (!delivery)
			return res
				.status(404)
				.json({ success: false, message: "Tracking info not found" });

		res.json({ success: true, data: delivery });
	} catch (error) {
		console.error("Get tracking error:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to get tracking info" });
	}
};

module.exports = exports;
