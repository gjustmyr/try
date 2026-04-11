const { Address } = require("../models");

// Get all addresses for user
exports.getAddresses = async (req, res) => {
	try {
		const addresses = await Address.findAll({
			where: { userId: req.user.id },
			order: [
				["isDefault", "DESC"],
				["createdAt", "DESC"],
			],
		});
		res.json({ success: true, data: addresses });
	} catch (error) {
		console.error("Get addresses error:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to get addresses" });
	}
};

// Add new address
exports.addAddress = async (req, res) => {
	try {
		const {
			label,
			fullName,
			phone,
			region,
			province,
			city,
			barangay,
			postalCode,
			streetAddress,
			isDefault,
			latitude,
			longitude,
		} = req.body;

		if (
			!fullName ||
			!phone ||
			!region ||
			!province ||
			!city ||
			!barangay ||
			!postalCode ||
			!streetAddress
		) {
			return res
				.status(400)
				.json({ success: false, message: "All address fields are required" });
		}

		// If setting as default, unset existing default
		if (isDefault) {
			await Address.update(
				{ isDefault: false },
				{ where: { userId: req.user.id } },
			);
		}

		// If first address, make it default
		const count = await Address.count({ where: { userId: req.user.id } });
		const shouldBeDefault = isDefault || count === 0;

		const address = await Address.create({
			userId: req.user.id,
			label: label || "Home",
			fullName,
			phone,
			region,
			province,
			city,
			barangay,
			postalCode,
			streetAddress,
			isDefault: shouldBeDefault,
			latitude: latitude || null,
			longitude: longitude || null,
		});

		res
			.status(201)
			.json({ success: true, data: address, message: "Address added" });
	} catch (error) {
		console.error("Add address error:", error);
		res.status(500).json({ success: false, message: "Failed to add address" });
	}
};

// Update address
exports.updateAddress = async (req, res) => {
	try {
		const { addressId } = req.params;
		const address = await Address.findOne({
			where: { id: addressId, userId: req.user.id },
		});

		if (!address) {
			return res
				.status(404)
				.json({ success: false, message: "Address not found" });
		}

		const {
			label,
			fullName,
			phone,
			region,
			province,
			city,
			barangay,
			postalCode,
			streetAddress,
			isDefault,
			latitude,
			longitude,
		} = req.body;

		if (isDefault) {
			await Address.update(
				{ isDefault: false },
				{ where: { userId: req.user.id } },
			);
		}

		await address.update({
			label: label || address.label,
			fullName: fullName || address.fullName,
			phone: phone || address.phone,
			region: region || address.region,
			province: province || address.province,
			city: city || address.city,
			barangay: barangay || address.barangay,
			postalCode: postalCode || address.postalCode,
			streetAddress: streetAddress || address.streetAddress,
			isDefault: isDefault !== undefined ? isDefault : address.isDefault,
			latitude: latitude !== undefined ? latitude : address.latitude,
			longitude: longitude !== undefined ? longitude : address.longitude,
		});

		res.json({ success: true, data: address, message: "Address updated" });
	} catch (error) {
		console.error("Update address error:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to update address" });
	}
};

// Delete address
exports.deleteAddress = async (req, res) => {
	try {
		const { addressId } = req.params;
		const address = await Address.findOne({
			where: { id: addressId, userId: req.user.id },
		});

		if (!address) {
			return res
				.status(404)
				.json({ success: false, message: "Address not found" });
		}

		const wasDefault = address.isDefault;
		await address.destroy();

		// If deleted was default, set another as default
		if (wasDefault) {
			const next = await Address.findOne({
				where: { userId: req.user.id },
				order: [["createdAt", "ASC"]],
			});
			if (next) {
				await next.update({ isDefault: true });
			}
		}

		res.json({ success: true, message: "Address deleted" });
	} catch (error) {
		console.error("Delete address error:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to delete address" });
	}
};

// Set default address
exports.setDefault = async (req, res) => {
	try {
		const { addressId } = req.params;
		const address = await Address.findOne({
			where: { id: addressId, userId: req.user.id },
		});

		if (!address) {
			return res
				.status(404)
				.json({ success: false, message: "Address not found" });
		}

		await Address.update(
			{ isDefault: false },
			{ where: { userId: req.user.id } },
		);
		await address.update({ isDefault: true });

		res.json({ success: true, message: "Default address updated" });
	} catch (error) {
		console.error("Set default address error:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to set default address" });
	}
};
