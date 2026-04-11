const { User, Seller, Product, Order, OrderItem } = require("../models");
const sellerService = require("../services/seller.service");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");

// Register new seller
exports.registerSeller = async (req, res) => {
  try {
    const {
      shopName,
      fullName,
      email,
      phone,
      businessType,
      businessRegNumber,
      businessAddress,
      password,
    } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    if (!req.files || !req.files.governmentId || !req.files.businessLicense) {
      return res.status(400).json({
        success: false,
        message: "Government ID and Business License are required",
      });
    }

    const docs = await sellerService.uploadSellerDocuments(req.files);

    const { user, seller } = await sellerService.createUserAndSeller(
      { email, password },
      {
        shopName,
        fullName,
        phone,
        businessType,
        businessRegNumber,
        businessAddress,
      },
      docs,
    );

    await sellerService.cleanupTempFiles(req.files);

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email for the OTP code.",
      data: {
        id: user.id,
        email: user.email,
        shopName: seller.shopName,
      },
    });
  } catch (error) {
    console.error("Seller registration error:", error);

    if (req.files) {
      await sellerService.cleanupTempFiles(req.files);
    }

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    const isValid = await sellerService.verifyUserOtp(user, otp);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Email verified successfully. Your application is now pending admin approval.",
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed",
      error: error.message,
    });
  }
};

// Resend OTP
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    await sellerService.regenerateOtp(user);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
      error: error.message,
    });
  }
};

// Get seller status
exports.getSellerStatus = async (req, res) => {
  try {
    const { email } = req.query;

    const user = await sellerService.getSellerStatusByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get seller status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get seller status",
      error: error.message,
    });
  }
};

// Get seller profile
exports.getSellerProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const seller = await sellerService.findSellerByUserId(userId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: seller,
    });
  } catch (error) {
    console.error("Get seller profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get seller profile",
      error: error.message,
    });
  }
};

// Update seller profile
exports.updateSellerProfile = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const {
      shopName,
      shopDescription,
      phone,
      businessAddress,
      latitude,
      longitude,
    } = req.body;

    const seller = await sellerService.updateSellerProfile(sellerId, {
      shopName,
      shopDescription,
      phone,
      businessAddress,
      latitude,
      longitude,
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: seller,
    });
  } catch (error) {
    console.error("Update seller profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// Get all approved shops (public)
exports.getAllShops = async (req, res) => {
  try {
    const { search } = req.query;
    const shops = await sellerService.findAllApprovedShops({ search });

    // Get product counts and review stats for each shop
    const { Review } = require("../models");
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

    res.status(200).json({
      success: true,
      data: shopsWithCounts,
    });
  } catch (error) {
    console.error("Get all shops error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get shops",
    });
  }
};

// Get shop detail with products (public)
exports.getShopDetail = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const shop = await sellerService.findShopPublic(sellerId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    const products = await sellerService.getShopProducts(sellerId);
    const productCount = await sellerService.getShopProductCount(sellerId);

    // Get seller reviews aggregation
    const { Review } = require("../models");
    const reviews = await Review.findAll({
      where: { sellerId },
      attributes: ["rating"],
    });

    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    res.status(200).json({
      success: true,
      data: {
        shop: {
          ...shop.toJSON(),
          productCount,
          avgRating: Math.round(avgRating * 10) / 10,
          totalReviews,
        },
        products,
      },
    });
  } catch (error) {
    console.error("Get shop detail error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get shop details",
    });
  }
};

// Get seller dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const seller = await Seller.findOne({ where: { userId: req.user.id } });
    if (!seller) {
      return res
        .status(403)
        .json({ success: false, message: "Seller not found" });
    }

    // Product count
    const productCount = await Product.count({
      where: { sellerId: seller.id },
    });

    // Order stats from OrderItems belonging to this seller
    const sellerItems = await OrderItem.findAll({
      where: { sellerId: seller.id },
      include: [
        {
          model: Order,
          as: "order",
          attributes: ["id", "status", "createdAt", "userId"],
        },
      ],
    });

    const orderIds = [
      ...new Set(sellerItems.map((i) => i.order?.id).filter(Boolean)),
    ];
    const totalOrders = orderIds.length;

    // Revenue from delivered orders only
    const totalRevenue = sellerItems
      .filter((i) => i.order?.status === "delivered")
      .reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);

    // Unique customers
    const uniqueCustomers = [
      ...new Set(sellerItems.map((i) => i.order?.userId).filter(Boolean)),
    ].length;

    // Recent orders (last 5)
    const recentOrderIds = [...new Set(sellerItems.map((i) => i.orderId))];
    const recentOrders = await Order.findAll({
      where: { id: { [Op.in]: recentOrderIds } },
      include: [
        { model: User, as: "user", attributes: ["id", "fullName", "email"] },
        { model: OrderItem, as: "items", where: { sellerId: seller.id } },
      ],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    // Pending orders count
    const pendingOrders = await Order.count({
      where: { id: { [Op.in]: orderIds }, status: "pending" },
    });

    // Top products by sales
    const topProducts = await Product.findAll({
      where: { sellerId: seller.id },
      order: [["sales", "DESC"]],
      limit: 5,
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        productCount,
        uniqueCustomers,
        pendingOrders,
        recentOrders,
        topProducts,
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get dashboard stats" });
  }
};

// Get seller's customers
exports.getSellerCustomers = async (req, res) => {
  try {
    const seller = await Seller.findOne({ where: { userId: req.user.id } });
    if (!seller) {
      return res
        .status(403)
        .json({ success: false, message: "Seller not found" });
    }

    // Find all orders that contain items from this seller
    const sellerItems = await OrderItem.findAll({
      where: { sellerId: seller.id },
      include: [
        {
          model: Order,
          as: "order",
          attributes: ["id", "userId", "total", "status", "createdAt"],
        },
      ],
    });

    // Group by customer
    const customerMap = new Map();
    for (const item of sellerItems) {
      if (!item.order) continue;
      const userId = item.order.userId;
      if (!customerMap.has(userId)) {
        customerMap.set(userId, {
          userId,
          orderCount: 0,
          totalSpent: 0,
          lastOrderDate: null,
          orderIds: new Set(),
        });
      }
      const c = customerMap.get(userId);
      if (!c.orderIds.has(item.orderId)) {
        c.orderIds.add(item.orderId);
        c.orderCount++;
      }
      c.totalSpent += parseFloat(item.price) * item.quantity;
      if (
        !c.lastOrderDate ||
        new Date(item.order.createdAt) > new Date(c.lastOrderDate)
      ) {
        c.lastOrderDate = item.order.createdAt;
      }
    }

    // Fetch user details
    const userIds = [...customerMap.keys()];
    const users = await User.findAll({
      where: { id: { [Op.in]: userIds } },
      attributes: ["id", "fullName", "email", "createdAt"],
    });

    const customers = users
      .map((u) => {
        const stats = customerMap.get(u.id);
        return {
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          memberSince: u.createdAt,
          orderCount: stats.orderCount,
          totalSpent: stats.totalSpent,
          lastOrderDate: stats.lastOrderDate,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);

    res.json({ success: true, data: customers });
  } catch (error) {
    console.error("Get seller customers error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get customers" });
  }
};

module.exports = exports;
