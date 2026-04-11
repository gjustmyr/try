const {
  Order,
  OrderItem,
  Cart,
  Product,
  Seller,
  Address,
  User,
  InventoryLog,
  Review,
} = require("../models");
const { sequelize } = require("../config/database");
const { Op } = require("sequelize");

// Place order
exports.placeOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { addressId, cartItemIds, notes } = req.body;
    const userId = req.user.id;

    if (!addressId) {
      return res
        .status(400)
        .json({ success: false, message: "Delivery address is required" });
    }
    if (!cartItemIds || cartItemIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No items selected" });
    }

    // Verify address
    const address = await Address.findOne({ where: { id: addressId, userId } });
    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    // Get cart items with products
    const cartItems = await Cart.findAll({
      where: { id: cartItemIds, userId },
      include: [
        {
          model: Product,
          as: "product",
          include: [
            { model: Seller, as: "seller", attributes: ["id", "shopName"] },
          ],
        },
      ],
      transaction: t,
    });

    if (cartItems.length === 0) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "No valid cart items found" });
    }

    // Calculate subtotal and validate stock
    let subtotal = 0;
    for (const item of cartItems) {
      if (!item.product || item.product.status !== "active") {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Product "${item.product?.name || "Unknown"}" is no longer available`,
        });
      }
      if (item.quantity > item.product.quantity) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.product.name}"`,
        });
      }
      subtotal += parseFloat(item.product.price) * item.quantity;
    }

    const shippingFee = 0;
    const total = subtotal + shippingFee;

    // Generate order number
    const orderNumber =
      "MS-" +
      Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    // Calculate estimated delivery (5-7 business days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    // Create order
    const order = await Order.create(
      {
        userId,
        addressId,
        orderNumber,
        subtotal,
        shippingFee,
        total,
        paymentMethod: "cod",
        notes: notes || null,
        estimatedDelivery,
      },
      { transaction: t },
    );

    // Create order items and reduce stock
    for (const item of cartItems) {
      await OrderItem.create(
        {
          orderId: order.id,
          productId: item.product.id,
          sellerId: item.product.seller.id,
          productName: item.product.name,
          productImage: item.product.images?.[0] || null,
          price: item.product.price,
          quantity: item.quantity,
        },
        { transaction: t },
      );

      // Reduce product stock and increment sales
      const quantityBefore = item.product.quantity;
      const quantityChange = -item.quantity;
      const quantityAfter = quantityBefore + quantityChange;

      await item.product.update(
        {
          quantity: quantityAfter,
          sales: item.product.sales + item.quantity,
        },
        { transaction: t },
      );

      // Log inventory change
      await InventoryLog.create(
        {
          productId: item.product.id,
          sellerId: item.product.seller.id,
          type: "sale",
          quantityBefore,
          quantityChange,
          quantityAfter,
          reason: "Order placed",
          orderId: order.id,
          performedBy: userId,
        },
        { transaction: t },
      );
    }

    // Remove ordered items from cart
    await Cart.destroy({ where: { id: cartItemIds, userId }, transaction: t });

    await t.commit();

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        estimatedDelivery: order.estimatedDelivery,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Place order error:", error);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
};

// Get user orders
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.findAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            { model: Seller, as: "seller", attributes: ["id", "shopName"] },
          ],
        },
        { model: Address, as: "address" },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Check if each order has been reviewed
    const ordersWithReviewStatus = await Promise.all(
      orders.map(async (order) => {
        const orderJson = order.toJSON();

        // Check if any product in this order has been reviewed by this user
        const hasReview = await Review.findOne({
          where: {
            userId,
            orderId: order.id,
          },
        });

        orderJson.hasReview = !!hasReview;
        return orderJson;
      }),
    );

    res.json({ success: true, data: ordersWithReviewStatus });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ success: false, message: "Failed to get orders" });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.orderId, userId: req.user.id },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            { model: Product, as: "product" },
            { model: Seller, as: "seller", attributes: ["id", "shopName"] },
          ],
        },
        { model: Address, as: "address" },
      ],
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ success: false, message: "Failed to get order" });
  }
};

// Get seller orders (orders that contain items from this seller)
exports.getSellerOrders = async (req, res) => {
  try {
    const seller = await Seller.findOne({ where: { userId: req.user.id } });
    if (!seller) {
      return res
        .status(403)
        .json({ success: false, message: "Seller not found" });
    }

    const { status } = req.query;

    // Find all order IDs that have items belonging to this seller
    const sellerItemWhere = { sellerId: seller.id };
    const orderItemRows = await OrderItem.findAll({
      where: sellerItemWhere,
      attributes: ["orderId"],
    });

    const orderIds = [...new Set(orderItemRows.map((r) => r.orderId))];
    if (orderIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const orderWhere = { id: { [Op.in]: orderIds } };
    if (status && status !== "all") {
      orderWhere.status = status;
    }

    const orders = await Order.findAll({
      where: orderWhere,
      include: [
        {
          model: OrderItem,
          as: "items",
          where: { sellerId: seller.id },
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "images"],
            },
          ],
        },
        { model: Address, as: "address" },
        { model: User, as: "user", attributes: ["id", "fullName", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Get seller orders error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get seller orders" });
  }
};

// Get order tracking info (from Order model)
exports.getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.orderId, userId: req.user.id },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "images"],
            },
            {
              model: Seller,
              as: "seller",
              attributes: [
                "id",
                "shopName",
                "businessAddress",
                "latitude",
                "longitude",
              ],
            },
          ],
        },
        { model: Address, as: "address" },
      ],
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Get order tracking error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get order tracking info" });
  }
};

// Update order status (seller)
exports.updateOrderStatus = async (req, res) => {
  try {
    const seller = await Seller.findOne({ where: { userId: req.user.id } });
    if (!seller) {
      return res
        .status(403)
        .json({ success: false, message: "Seller not found" });
    }

    const { orderId } = req.params;
    const { status, trackingNumber } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    // Sellers can only set up to processing — shipping is handled by hub system
    if (status === "shipped" || status === "out_for_delivery") {
      return res.status(400).json({
        success: false,
        message:
          "Shipping is handled through the hub system. Drop off your parcel at a hub.",
      });
    }

    // Verify this order has items from this seller
    const hasItems = await OrderItem.findOne({
      where: { orderId, sellerId: seller.id },
    });
    if (!hasItems) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Prevent updating cancelled or delivered orders
    if (order.status === "cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot update a cancelled order" });
    }
    if (order.status === "delivered") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot update a delivered order" });
    }
    // Prevent cancellation once shipped
    if (
      status === "cancelled" &&
      (order.status === "shipped" || order.status === "delivered")
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel an order that has already been shipped",
      });
    }

    const t = await sequelize.transaction();
    try {
      // If cancelling, return stock for all items in this order from this seller
      if (status === "cancelled") {
        const sellerItems = await OrderItem.findAll({
          where: { orderId, sellerId: seller.id },
          transaction: t,
        });
        for (const item of sellerItems) {
          const product = await Product.findByPk(item.productId, {
            transaction: t,
          });
          if (product) {
            const quantityBefore = product.quantity;
            const quantityChange = item.quantity;
            const quantityAfter = quantityBefore + quantityChange;

            await product.update(
              {
                quantity: quantityAfter,
                sales: Math.max(0, product.sales - item.quantity),
              },
              { transaction: t },
            );

            // Log inventory return
            await InventoryLog.create(
              {
                productId: product.id,
                sellerId: seller.id,
                type: "return",
                quantityBefore,
                quantityChange,
                quantityAfter,
                reason: "Order cancelled",
                orderId,
                performedBy: seller.userId,
              },
              { transaction: t },
            );
          }
        }
      }

      // Update ETA based on new status
      let estimatedDelivery = order.estimatedDelivery;
      if (status === "confirmed") {
        estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);
      } else if (status === "processing") {
        estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 4);
      } else if (status === "shipped") {
        estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
      } else if (status === "delivered" || status === "cancelled") {
        estimatedDelivery = null;
      }

      const updateData = { status, estimatedDelivery };
      if (status === "shipped" && trackingNumber) {
        updateData.trackingNumber = trackingNumber;
      }

      await order.update(updateData, { transaction: t });
      await t.commit();

      res.json({
        success: true,
        message: "Order status updated",
        data: {
          id: order.id,
          status: order.status,
          estimatedDelivery: order.estimatedDelivery,
          trackingNumber: order.trackingNumber,
        },
      });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (error) {
    console.error("Update order status error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update order status" });
  }
};
