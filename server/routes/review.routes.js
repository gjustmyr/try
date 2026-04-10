const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const { authenticate } = require("../middleware/auth");

// Public: Get reviews for a product
router.get("/product/:productId", reviewController.getProductReviews);

// Authenticated: Create a review
router.post("/", authenticate, reviewController.createReview);

// Authenticated: Get seller's reviews
router.get("/seller", authenticate, reviewController.getSellerReviews);

module.exports = router;
