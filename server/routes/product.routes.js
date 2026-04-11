const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { uploadProductImages } = require("../middleware/upload");

// Public routes (no auth required)
router.get("/", productController.getAllProducts);
router.get("/view/:productId", productController.getProductPublic);

// All routes below require authentication
router.use(authenticate);

// Get all products for a seller
router.get("/seller/:sellerId", productController.getSellerProducts);

// Get single product
router.get("/:productId", productController.getProduct);

// Create product (seller only)
router.post(
	"/",
	authorize("seller"),
	uploadProductImages,
	productController.createProduct,
);

// Update product (seller only)
router.put(
	"/:productId",
	authorize("seller"),
	uploadProductImages,
	productController.updateProduct,
);

// Delete product (seller only)
router.delete(
	"/:productId",
	authorize("seller"),
	productController.deleteProduct,
);

// Toggle publish status (seller only)
router.patch(
	"/:productId/publish",
	authorize("seller"),
	productController.togglePublish,
);

module.exports = router;
