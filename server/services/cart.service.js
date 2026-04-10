const { Cart, Product, Seller } = require("../models");

exports.getCartItems = async (userId) => {
  return Cart.findAll({
    where: { userId },
    include: [
      {
        model: Product,
        as: "product",
        include: [
          {
            model: Seller,
            as: "seller",
            attributes: ["id", "shopName"],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

exports.addToCart = async (userId, productId, quantity = 1) => {
  const product = await Product.findByPk(productId);
  if (!product) {
    throw { status: 404, message: "Product not found" };
  }

  if (product.status !== "active") {
    throw { status: 400, message: "Product is not available" };
  }

  if (quantity > product.quantity) {
    throw { status: 400, message: "Requested quantity exceeds available stock" };
  }

  // Check if item already in cart
  const existing = await Cart.findOne({
    where: { userId, productId },
  });

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > product.quantity) {
      throw { status: 400, message: "Total quantity exceeds available stock" };
    }
    existing.quantity = newQty;
    await existing.save();
    return existing;
  }

  return Cart.create({ userId, productId, quantity });
};

exports.updateCartItem = async (userId, cartItemId, quantity) => {
  const cartItem = await Cart.findOne({
    where: { id: cartItemId, userId },
    include: [{ model: Product, as: "product" }],
  });

  if (!cartItem) {
    throw { status: 404, message: "Cart item not found" };
  }

  if (quantity > cartItem.product.quantity) {
    throw { status: 400, message: "Quantity exceeds available stock" };
  }

  cartItem.quantity = quantity;
  await cartItem.save();
  return cartItem;
};

exports.removeFromCart = async (userId, cartItemId) => {
  const cartItem = await Cart.findOne({
    where: { id: cartItemId, userId },
  });

  if (!cartItem) {
    throw { status: 404, message: "Cart item not found" };
  }

  await cartItem.destroy();
};

exports.clearCart = async (userId) => {
  await Cart.destroy({ where: { userId } });
};

exports.getCartCount = async (userId) => {
  const items = await Cart.findAll({ where: { userId } });
  return items.reduce((sum, item) => sum + item.quantity, 0);
};
