const User = require("./user.model");
const Seller = require("./seller.model");
const Product = require("./product.model");
const Cart = require("./cart.model");
const Address = require("./address.model");
const { Order, OrderItem } = require("./order.model");
const Review = require("./review.model");
const DeliveryHub = require("./delivery-hub.model");
const Driver = require("./driver.model");
const Delivery = require("./delivery.model");

// Define associations
User.hasOne(Seller, {
  foreignKey: "userId",
  as: "sellerProfile",
  onDelete: "CASCADE",
});

Seller.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Self-reference for approvedBy
Seller.belongsTo(User, {
  foreignKey: "approvedBy",
  as: "approver",
});

// Product associations
Seller.hasMany(Product, {
  foreignKey: "sellerId",
  as: "products",
  onDelete: "CASCADE",
});

Product.belongsTo(Seller, {
  foreignKey: "sellerId",
  as: "seller",
});

// Cart associations
User.hasMany(Cart, {
  foreignKey: "userId",
  as: "cartItems",
  onDelete: "CASCADE",
});

Cart.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Product.hasMany(Cart, {
  foreignKey: "productId",
  as: "cartEntries",
  onDelete: "CASCADE",
});

Cart.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

// Address associations
User.hasMany(Address, {
  foreignKey: "userId",
  as: "addresses",
  onDelete: "CASCADE",
});

Address.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Order associations
User.hasMany(Order, {
  foreignKey: "userId",
  as: "orders",
  onDelete: "CASCADE",
});

Order.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Order.belongsTo(Address, {
  foreignKey: "addressId",
  as: "address",
});

Order.hasMany(OrderItem, {
  foreignKey: "orderId",
  as: "items",
  onDelete: "CASCADE",
});

OrderItem.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

OrderItem.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

OrderItem.belongsTo(Seller, {
  foreignKey: "sellerId",
  as: "seller",
});

// Review associations
User.hasMany(Review, {
  foreignKey: "userId",
  as: "reviews",
  onDelete: "CASCADE",
});

Review.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Product.hasMany(Review, {
  foreignKey: "productId",
  as: "reviews",
  onDelete: "CASCADE",
});

Review.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

Seller.hasMany(Review, {
  foreignKey: "sellerId",
  as: "reviews",
  onDelete: "CASCADE",
});

Review.belongsTo(Seller, {
  foreignKey: "sellerId",
  as: "seller",
});

// Driver associations
User.hasOne(Driver, {
  foreignKey: "userId",
  as: "driverProfile",
  onDelete: "CASCADE",
});

Driver.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Driver.belongsTo(DeliveryHub, {
  foreignKey: "hubId",
  as: "hub",
});

DeliveryHub.hasMany(Driver, {
  foreignKey: "hubId",
  as: "drivers",
});

// Delivery associations
Delivery.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

Order.hasOne(Delivery, {
  foreignKey: "orderId",
  as: "delivery",
});

Delivery.belongsTo(Driver, {
  foreignKey: "driverId",
  as: "driver",
});

Driver.hasMany(Delivery, {
  foreignKey: "driverId",
  as: "deliveries",
});

Delivery.belongsTo(DeliveryHub, {
  foreignKey: "hubId",
  as: "hub",
});

Delivery.belongsTo(DeliveryHub, {
  foreignKey: "destinationHubId",
  as: "destinationHub",
});

module.exports = {
  User,
  Seller,
  Product,
  Cart,
  Address,
  Order,
  OrderItem,
  Review,
  DeliveryHub,
  Driver,
  Delivery,
};
