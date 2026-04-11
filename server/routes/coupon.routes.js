const express = require("express");
const router = express.Router();
const couponController = require("../controllers/coupon.controller");
const { authenticate, authorize } = require("../middleware/auth");

// Public: Get active coupons
router.get("/active", couponController.getActiveCoupons);

// Customer: Validate coupon
router.post("/validate", authenticate, couponController.validateCoupon);

// Admin: Coupon management
router.post(
  "/",
  authenticate,
  authorize("admin"),
  couponController.createCoupon,
);
router.get(
  "/",
  authenticate,
  authorize("admin"),
  couponController.getAllCoupons,
);
router.put(
  "/:couponId",
  authenticate,
  authorize("admin"),
  couponController.updateCoupon,
);
router.delete(
  "/:couponId",
  authenticate,
  authorize("admin"),
  couponController.deleteCoupon,
);

module.exports = router;
