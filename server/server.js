const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const { sequelize, testConnection } = require("./config/database");
const {
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
} = require("./models");
const authRoutes = require("./routes/auth.routes");
const sellerRoutes = require("./routes/seller.routes");
const adminRoutes = require("./routes/admin.routes");
const productRoutes = require("./routes/product.routes");
const cartRoutes = require("./routes/cart.routes");
const addressRoutes = require("./routes/address.routes");
const orderRoutes = require("./routes/order.routes");
const reviewRoutes = require("./routes/review.routes");
const driverRoutes = require("./routes/driver.routes");
const deliveryRoutes = require("./routes/delivery.routes");
const hubRoutes = require("./routes/hub.routes");
const paymentRoutes = require("./routes/payment.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const taxRoutes = require("./routes/tax.routes");
const couponRoutes = require("./routes/coupon.routes");
const notificationRoutes = require("./routes/notification.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads", "temp");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", require("./routes/wishlist.routes"));
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/hub", hubRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/tax", taxRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/notifications", notificationRoutes);

// Unified search endpoint
const productService = require("./services/product.service");
const sellerService = require("./services/seller.service");
app.get("/api/search", async (req, res) => {
  try {
    const { q, limit } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json({ success: true, data: { products: [], shops: [] } });
    }
    const searchLimit = parseInt(limit) || 5;
    const [products, shops] = await Promise.all([
      productService.findAllActiveProducts({
        search: q.trim(),
        limit: searchLimit,
      }),
      sellerService.findAllApprovedShops({
        search: q.trim(),
        limit: searchLimit,
      }),
    ]);

    const { Review } = require("./models");
    const shopsWithCounts = await Promise.all(
      shops.map(async (shop) => {
        const productCount = await sellerService.getShopProductCount(shop.id);

        // Get seller reviews aggregation
        const reviews = await Review.findAll({
          where: { sellerId: shop.id },
          attributes: ["rating"],
        });

        const totalReviews = reviews.length;
        const avgRating =
          totalReviews > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;

        return {
          ...shop.toJSON(),
          productCount,
          avgRating: Math.round(avgRating * 10) / 10,
          totalReviews,
        };
      }),
    );
    res.json({ success: true, data: { products, shops: shopsWithCounts } });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ success: false, message: "Search failed" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Migrate ENUM columns to VARCHAR before sync to support new status values
    try {
      await sequelize.query(
        `ALTER TABLE deliveries ALTER COLUMN status TYPE VARCHAR(255) USING status::VARCHAR(255);`,
      );
      await sequelize.query(
        `ALTER TABLE orders ALTER COLUMN status TYPE VARCHAR(255) USING status::VARCHAR(255);`,
      );
      console.log("✓ Status columns migrated to VARCHAR");
    } catch (e) {
      // Columns may already be VARCHAR - ignore
    }

    // Sync database models
    await sequelize.sync({ alter: true });
    console.log("✓ Database models synchronized");

    // Backfill estimatedDelivery for existing orders that don't have one
    const { Order } = require("./models");
    const [backfilled] = await sequelize.query(
      `UPDATE orders SET estimated_delivery = created_at + INTERVAL '7 days' WHERE estimated_delivery IS NULL AND status NOT IN ('delivered', 'cancelled')`,
    );
    console.log("✓ Backfilled estimated_delivery for existing orders");

    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server is running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("✗ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
