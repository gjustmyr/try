const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth");
const { body } = require("express-validator");

// Validation middleware
const validateLogin = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const validateRegister = [
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

// Register
router.post("/register", validateRegister, authController.register);

// Verify email
router.post("/verify-email", authController.verifyEmail);

// Resend OTP
router.post("/resend-otp", authController.resendOtp);

// Login
router.post("/login", validateLogin, authController.login);

// Get current user profile (protected route)
router.get("/profile", authenticate, authController.getProfile);

// Logout
router.post("/logout", authenticate, authController.logout);

// Change password
router.put("/change-password", authenticate, authController.changePassword);

module.exports = router;
