const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const { authenticate } = require("../middleware/auth");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// Public: Get reviews for a product
router.get("/product/:productId", reviewController.getProductReviews);

// Authenticated: Create a review (with image upload support)
router.post(
  "/",
  authenticate,
  upload.array("images", 5),
  reviewController.createReview,
);

// Authenticated: Get seller's reviews
router.get("/seller", authenticate, reviewController.getSellerReviews);

module.exports = router;
