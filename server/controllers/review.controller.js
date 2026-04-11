const {
  Review,
  User,
  Product,
  Seller,
  OrderItem,
  Order,
} = require("../models");
const { Op } = require("sequelize");
const cloudinary = require("../config/cloudinary");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// Create a review (customer only, must have purchased the product)
exports.createReview = async (req, res) => {
  try {
    const { productId, sellerId, rating, comment, orderId } = req.body;
    const userId = req.user.id;

    if (!productId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Product ID and rating are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5" });
    }

    // Check product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Check if user has purchased this product (delivered orders only)
    const purchased = await OrderItem.findOne({
      where: { productId },
      include: [
        {
          model: Order,
          as: "order",
          where: { userId, status: "delivered" },
        },
      ],
    });

    if (!purchased) {
      return res.status(403).json({
        success: false,
        message: "You can only review products you have purchased and received",
      });
    }

    // Check if already reviewed
    const existing = await Review.findOne({ where: { userId, productId } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    // Upload images to Cloudinary if provided
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "reviews",
                resource_type: "image",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              },
            );
            uploadStream.end(file.buffer);
          });

          images.push({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
        }
      }
    }

    const review = await Review.create({
      userId,
      productId,
      sellerId: sellerId || product.sellerId,
      rating: parseInt(rating),
      comment: comment || null,
      images,
      orderId: orderId || null,
    });

    res
      .status(201)
      .json({ success: true, message: "Review submitted", data: review });
  } catch (error) {
    console.error("Create review error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to submit review" });
  }
};

// Get reviews for a product (public)
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.findAll({
      where: { productId },
      include: [{ model: User, as: "user", attributes: ["id", "fullName"] }],
      order: [["createdAt", "DESC"]],
    });

    // Calculate stats
    const total = reviews.length;
    const avgRating =
      total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));

    res.json({
      success: true,
      data: {
        reviews,
        avgRating: Math.round(avgRating * 10) / 10,
        total,
        distribution,
      },
    });
  } catch (error) {
    console.error("Get product reviews error:", error);
    res.status(500).json({ success: false, message: "Failed to get reviews" });
  }
};

// Get all reviews for a seller's products
exports.getSellerReviews = async (req, res) => {
  try {
    const seller = await Seller.findOne({ where: { userId: req.user.id } });
    if (!seller) {
      return res
        .status(403)
        .json({ success: false, message: "Seller not found" });
    }

    const reviews = await Review.findAll({
      where: { sellerId: seller.id },
      include: [
        { model: User, as: "user", attributes: ["id", "fullName"] },
        { model: Product, as: "product", attributes: ["id", "name", "images"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const total = reviews.length;
    const avgRating =
      total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));

    res.json({
      success: true,
      data: {
        reviews,
        avgRating: Math.round(avgRating * 10) / 10,
        total,
        distribution,
      },
    });
  } catch (error) {
    console.error("Get seller reviews error:", error);
    res.status(500).json({ success: false, message: "Failed to get reviews" });
  }
};

module.exports = exports;
