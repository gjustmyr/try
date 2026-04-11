const productService = require("../services/product.service");
const { Seller } = require("../models");

// Get all active products (public)
exports.getAllProducts = async (req, res) => {
	try {
		const { category, search } = req.query;

		const products = await productService.findAllActiveProducts({
			category,
			search,
		});

		res.status(200).json({
			success: true,
			data: products,
		});
	} catch (error) {
		console.error("Get all products error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get products",
			error: error.message,
		});
	}
};

// Get all products for a seller
exports.getSellerProducts = async (req, res) => {
	try {
		const { sellerId } = req.params;
		const { status, search } = req.query;

		const products = await productService.findProductsBySeller(sellerId, {
			status,
			search,
		});

		res.status(200).json({
			success: true,
			data: products,
		});
	} catch (error) {
		console.error("Get seller products error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get products",
			error: error.message,
		});
	}
};

// Get single product
exports.getProduct = async (req, res) => {
	try {
		const { productId } = req.params;

		const product = await productService.findProductById(productId, true);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		res.status(200).json({
			success: true,
			data: product,
		});
	} catch (error) {
		console.error("Get product error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get product",
			error: error.message,
		});
	}
};

// Get single product (public, no auth)
exports.getProductPublic = async (req, res) => {
	try {
		const { productId } = req.params;

		const product = await productService.findProductById(productId, true);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		res.status(200).json({
			success: true,
			data: product,
		});
	} catch (error) {
		console.error("Get product public error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get product",
			error: error.message,
		});
	}
};

// Create product
exports.createProduct = async (req, res) => {
	try {
		// Verify seller
		const seller = await Seller.findOne({ where: { userId: req.user.id } });
		if (!seller) {
			return res
				.status(403)
				.json({ success: false, message: "Seller not found" });
		}
		req.body.sellerId = seller.id;

		let images = [];
		if (req.files && req.files.length > 0) {
			images = await productService.uploadProductImages(req.files);
		}

		const product = await productService.createProduct(req.body, images);

		res.status(201).json({
			success: true,
			message: "Product created successfully",
			data: product,
		});
	} catch (error) {
		console.error("Create product error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to create product",
			error: error.message,
		});
	}
};

// Update product
exports.updateProduct = async (req, res) => {
	try {
		const { productId } = req.params;

		// Verify seller
		const seller = await Seller.findOne({ where: { userId: req.user.id } });
		if (!seller) {
			return res
				.status(403)
				.json({ success: false, message: "Seller not found" });
		}

		const product = await productService.findProductById(productId);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		// Verify ownership
		if (product.sellerId !== seller.id) {
			return res
				.status(403)
				.json({
					success: false,
					message: "Not authorized to update this product",
				});
		}

		let newImages = [];
		// If existingImages is provided, use only those (user may have removed some)
		if (req.body.existingImages) {
			try {
				newImages = JSON.parse(req.body.existingImages);
			} catch (e) {
				newImages = [...product.images];
			}
		} else {
			newImages = [...product.images];
		}
		if (req.files && req.files.length > 0) {
			const uploadedImages = await productService.uploadProductImages(
				req.files,
			);
			newImages = [...newImages, ...uploadedImages];
		}

		const updated = await productService.updateProduct(
			product,
			req.body,
			newImages,
		);

		res.status(200).json({
			success: true,
			message: "Product updated successfully",
			data: updated,
		});
	} catch (error) {
		console.error("Update product error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to update product",
			error: error.message,
		});
	}
};

// Delete product
exports.deleteProduct = async (req, res) => {
	try {
		const { productId } = req.params;

		// Verify seller
		const seller = await Seller.findOne({ where: { userId: req.user.id } });
		if (!seller) {
			return res
				.status(403)
				.json({ success: false, message: "Seller not found" });
		}

		const product = await productService.findProductById(productId);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		// Verify ownership
		if (product.sellerId !== seller.id) {
			return res
				.status(403)
				.json({
					success: false,
					message: "Not authorized to delete this product",
				});
		}

		await productService.deleteProduct(product);

		res.status(200).json({
			success: true,
			message: "Product deleted successfully",
		});
	} catch (error) {
		console.error("Delete product error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to delete product",
			error: error.message,
		});
	}
};

// Publish/Unpublish product
exports.togglePublish = async (req, res) => {
	try {
		const { productId } = req.params;

		// Verify seller
		const seller = await Seller.findOne({ where: { userId: req.user.id } });
		if (!seller) {
			return res
				.status(403)
				.json({ success: false, message: "Seller not found" });
		}

		const product = await productService.findProductById(productId);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		// Verify ownership
		if (product.sellerId !== seller.id) {
			return res
				.status(403)
				.json({
					success: false,
					message: "Not authorized to modify this product",
				});
		}

		const updated = await productService.togglePublish(product);

		res.status(200).json({
			success: true,
			message: `Product ${updated.isPublished ? "published" : "unpublished"} successfully`,
			data: updated,
		});
	} catch (error) {
		console.error("Toggle publish error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to toggle publish status",
			error: error.message,
		});
	}
};

module.exports = exports;
