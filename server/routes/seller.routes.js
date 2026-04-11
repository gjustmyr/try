const express = require("express");
const router = express.Router();
const sellerController = require("../controllers/seller.controller");
const { uploadSellerDocuments } = require("../middleware/upload");
const { body } = require("express-validator");

// Validation middleware
const validateSellerRegistration = [
	body("shopName").trim().notEmpty().withMessage("Shop name is required"),
	body("fullName").trim().notEmpty().withMessage("Full name is required"),
	body("email").isEmail().withMessage("Valid email is required"),
	body("phone").trim().notEmpty().withMessage("Phone number is required"),
	body("businessType")
		.isIn(["individual", "company"])
		.withMessage("Invalid business type"),
	body("businessAddress")
		.trim()
		.notEmpty()
		.withMessage("Business address is required"),
	body("password")
		.isLength({ min: 6 })
		.withMessage("Password must be at least 6 characters"),
];

// Register seller
router.post(
	"/register",
	uploadSellerDocuments,
	validateSellerRegistration,
	sellerController.registerSeller,
);

// Verify OTP
router.post("/verify-otp", sellerController.verifyOtp);

// Resend OTP
router.post("/resend-otp", sellerController.resendOtp);

// Public: Get all approved shops
router.get("/shops", sellerController.getAllShops);

// Public: Get shop detail with products
router.get("/shops/:sellerId", sellerController.getShopDetail);

// Get seller status
router.get("/status", sellerController.getSellerStatus);

// Get seller profile
router.get("/profile/:userId", sellerController.getSellerProfile);

// Update seller profile (requires auth)
const { authenticate } = require("../middleware/auth");
router.put(
	"/profile/:sellerId",
	authenticate,
	sellerController.updateSellerProfile,
);

// Dashboard stats (requires auth)
router.get(
	"/dashboard/stats",
	authenticate,
	sellerController.getDashboardStats,
);

// Seller customers (requires auth)
router.get("/customers", authenticate, sellerController.getSellerCustomers);

module.exports = router;
