const { Wishlist, Product, Seller } = require("../models");

// Get user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const wishlistItems = await Wishlist.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: "product",
          include: [{ model: Seller, as: "seller" }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, data: wishlistItems });
  } catch (error) {
    console.error("Get wishlist error:", error);
    res.status(500).json({ success: false, message: "Failed to get wishlist" });
  }
};

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    // Check if already in wishlist
    const existing = await Wishlist.findOne({
      where: { userId, productId },
    });

    if (existing) {
      return res.json({
        success: true,
        message: "Product already in wishlist",
        data: existing,
      });
    }

    const wishlistItem = await Wishlist.create({ userId, productId });
    res.json({
      success: true,
      message: "Added to wishlist",
      data: wishlistItem,
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to add to wishlist" });
  }
};

// Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const deleted = await Wishlist.destroy({
      where: { userId, productId },
    });

    if (deleted === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in wishlist" });
    }

    res.json({ success: true, message: "Removed from wishlist" });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to remove from wishlist" });
  }
};

// Check if product is in wishlist
exports.checkWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const item = await Wishlist.findOne({
      where: { userId, productId },
    });

    res.json({ success: true, inWishlist: !!item });
  } catch (error) {
    console.error("Check wishlist error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to check wishlist" });
  }
};
