const { User, Seller, Product } = require("../models");
const { uploadToCloudinary } = require("../config/cloudinary");
const { sendOtpEmail } = require("../utils/email");
const fs = require("fs").promises;
const { Op } = require("sequelize");

exports.findAllApprovedShops = async (filters = {}) => {
	const where = { approvalStatus: "approved" };

	if (filters.search) {
		where[Op.or] = [
			{ shopName: { [Op.iLike]: `%${filters.search}%` } },
			{ shopDescription: { [Op.iLike]: `%${filters.search}%` } },
		];
	}

	return Seller.findAll({
		where,
		attributes: [
			"id",
			"shopName",
			"shopDescription",
			"shopLogo",
			"shopBanner",
			"rating",
			"totalSales",
			"businessType",
			"createdAt",
		],
		order: [["totalSales", "DESC"]],
		...(filters.limit && { limit: filters.limit }),
	});
};

exports.findShopPublic = async (sellerId) => {
	return Seller.findByPk(sellerId, {
		attributes: [
			"id",
			"shopName",
			"shopDescription",
			"shopLogo",
			"shopBanner",
			"rating",
			"totalSales",
			"businessType",
			"businessAddress",
			"createdAt",
		],
	});
};

exports.getShopProducts = async (sellerId) => {
	return Product.findAll({
		where: { sellerId, status: "active" },
		include: [
			{
				model: Seller,
				as: "seller",
				attributes: ["id", "shopName", "rating"],
			},
		],
		order: [["createdAt", "DESC"]],
	});
};

exports.getShopProductCount = async (sellerId) => {
	return Product.count({
		where: { sellerId, status: "active" },
	});
};

exports.findSellerByUserId = async (userId) => {
	return Seller.findOne({
		where: { userId },
		include: [
			{
				model: User,
				as: "user",
				attributes: ["id", "email", "emailVerified", "isActive"],
			},
		],
	});
};

exports.findSellerById = async (sellerId, includeUser = false) => {
	const options = {};
	if (includeUser) {
		options.include = [
			{
				model: User,
				as: "user",
				attributes: ["id", "email"],
			},
		];
	}
	return Seller.findByPk(sellerId, options);
};

exports.uploadSellerDocuments = async (files) => {
	const docs = {};

	docs.governmentId = await uploadToCloudinary(
		files.governmentId[0],
		"sellers/government-ids",
	);

	docs.businessLicense = await uploadToCloudinary(
		files.businessLicense[0],
		"sellers/business-licenses",
	);

	if (files.proofOfAddress) {
		docs.proofOfAddress = await uploadToCloudinary(
			files.proofOfAddress[0],
			"sellers/proof-of-address",
		);
	}

	if (files.taxCertificate) {
		docs.taxCertificate = await uploadToCloudinary(
			files.taxCertificate[0],
			"sellers/tax-certificates",
		);
	}

	return docs;
};

exports.updateSellerProfile = async (sellerId, updates) => {
	const seller = await Seller.findByPk(sellerId);
	if (!seller) return null;

	const allowedFields = [
		"shopName",
		"shopDescription",
		"phone",
		"businessAddress",
	];
	const filteredUpdates = {};
	for (const key of allowedFields) {
		if (updates[key] !== undefined) {
			filteredUpdates[key] = updates[key];
		}
	}

	await seller.update(filteredUpdates);
	return seller;
};

exports.createUserAndSeller = async (userData, sellerData, docs) => {
	const user = await User.create({
		email: userData.email,
		password: userData.password,
		userType: "seller",
	});

	const otp = await user.generateVerificationOtp();
	await user.save();

	const seller = await Seller.create({
		userId: user.id,
		shopName: sellerData.shopName,
		fullName: sellerData.fullName,
		phone: sellerData.phone,
		businessType: sellerData.businessType,
		businessRegNumber: sellerData.businessRegNumber,
		businessAddress: sellerData.businessAddress,
		governmentIdUrl: docs.governmentId.url,
		governmentIdPublicId: docs.governmentId.publicId,
		businessLicenseUrl: docs.businessLicense.url,
		businessLicensePublicId: docs.businessLicense.publicId,
		proofOfAddressUrl: docs.proofOfAddress?.url,
		proofOfAddressPublicId: docs.proofOfAddress?.publicId,
		taxCertificateUrl: docs.taxCertificate?.url,
		taxCertificatePublicId: docs.taxCertificate?.publicId,
	});

	// Send OTP email (non-blocking)
	sendOtpEmail(user.email, otp).catch((emailError) => {
		console.error("Failed to send OTP email:", emailError);
	});

	return { user, seller };
};

exports.verifyUserOtp = async (user, otp) => {
	const isValid = await user.verifyOtp(otp);
	if (!isValid) return false;

	user.emailVerified = true;
	user.emailVerificationOtp = null;
	user.emailVerificationExpires = null;
	await user.save();
	return true;
};

exports.regenerateOtp = async (user) => {
	const otp = await user.generateVerificationOtp();
	await user.save();

	sendOtpEmail(user.email, otp).catch((emailError) => {
		console.error("Failed to send OTP email:", emailError);
	});
};

exports.getSellerStatusByEmail = async (email) => {
	return User.findOne({
		where: { email },
		include: [
			{
				model: Seller,
				as: "sellerProfile",
				attributes: ["id", "shopName", "approvalStatus", "createdAt"],
			},
		],
		attributes: ["id", "email", "emailVerified", "userType", "createdAt"],
	});
};

exports.cleanupTempFiles = async (files) => {
	try {
		for (const fieldName in files) {
			for (const file of files[fieldName]) {
				await fs.unlink(file.path);
			}
		}
	} catch (error) {
		console.error("Error cleaning up temp files:", error);
	}
};
