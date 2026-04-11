const cartService = require("../services/cart.service");

exports.getCart = async (req, res) => {
	try {
		const items = await cartService.getCartItems(req.user.id);
		res.status(200).json({
			success: true,
			data: items,
		});
	} catch (error) {
		console.error("Get cart error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get cart",
		});
	}
};

exports.addToCart = async (req, res) => {
	try {
		const { productId, quantity } = req.body;

		if (!productId) {
			return res.status(400).json({
				success: false,
				message: "Product ID is required",
			});
		}

		const item = await cartService.addToCart(
			req.user.id,
			productId,
			quantity || 1,
		);
		res.status(201).json({
			success: true,
			message: "Added to cart",
			data: item,
		});
	} catch (error) {
		console.error("Add to cart error:", error);
		const status = error.status || 500;
		res.status(status).json({
			success: false,
			message: error.message || "Failed to add to cart",
		});
	}
};

exports.updateCartItem = async (req, res) => {
	try {
		const { quantity } = req.body;
		const { itemId } = req.params;

		if (!quantity || quantity < 1) {
			return res.status(400).json({
				success: false,
				message: "Valid quantity is required",
			});
		}

		const item = await cartService.updateCartItem(
			req.user.id,
			itemId,
			quantity,
		);
		res.status(200).json({
			success: true,
			message: "Cart updated",
			data: item,
		});
	} catch (error) {
		console.error("Update cart error:", error);
		const status = error.status || 500;
		res.status(status).json({
			success: false,
			message: error.message || "Failed to update cart",
		});
	}
};

exports.removeFromCart = async (req, res) => {
	try {
		const { itemId } = req.params;
		await cartService.removeFromCart(req.user.id, itemId);
		res.status(200).json({
			success: true,
			message: "Item removed from cart",
		});
	} catch (error) {
		console.error("Remove from cart error:", error);
		const status = error.status || 500;
		res.status(status).json({
			success: false,
			message: error.message || "Failed to remove item",
		});
	}
};

exports.clearCart = async (req, res) => {
	try {
		await cartService.clearCart(req.user.id);
		res.status(200).json({
			success: true,
			message: "Cart cleared",
		});
	} catch (error) {
		console.error("Clear cart error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to clear cart",
		});
	}
};

exports.getCartCount = async (req, res) => {
	try {
		const count = await cartService.getCartCount(req.user.id);
		res.status(200).json({
			success: true,
			data: { count },
		});
	} catch (error) {
		console.error("Cart count error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get cart count",
		});
	}
};
