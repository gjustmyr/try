const { Coupon, CouponUsage, User } = require("../models");
const { Op } = require("sequelize");

// Validate coupon code
exports.validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal, sellerId, category } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    const coupon = await Coupon.findOne({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        validFrom: { [Op.lte]: new Date() },
        validUntil: { [Op.gte]: new Date() },
      },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired coupon code",
      });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit reached",
      });
    }

    // Check per-user limit
    const userUsageCount = await CouponUsage.count({
      where: { couponId: coupon.id, userId },
    });

    if (userUsageCount >= coupon.perUserLimit) {
      return res.status(400).json({
        success: false,
        message: "You have already used this coupon",
      });
    }

    // Check minimum order amount
    if (cartTotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₱${coupon.minOrderAmount} required`,
      });
    }

    // Check seller restriction
    if (
      coupon.applicableToSellers.length > 0 &&
      sellerId &&
      !coupon.applicableToSellers.includes(sellerId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Coupon not applicable to this seller",
      });
    }

    // Check category restriction
    if (
      coupon.applicableToCategories.length > 0 &&
      category &&
      !coupon.applicableToCategories.includes(category)
    ) {
      return res.status(400).json({
        success: false,
        message: "Coupon not applicable to this category",
      });
    }

    // Calculate discount
    let discountAmount = 0;
    let shippingDiscount = 0;

    if (coupon.discountType === "percentage") {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else if (coupon.discountType === "fixed") {
      discountAmount = Math.min(coupon.discountValue, cartTotal);
    } else if (coupon.discountType === "free_shipping") {
      shippingDiscount = coupon.discountValue;
    }

    res.json({
      success: true,
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
        },
        discountAmount: Math.round(discountAmount * 100) / 100,
        shippingDiscount: Math.round(shippingDiscount * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate coupon",
    });
  }
};

// Get all active coupons (public)
exports.getActiveCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.findAll({
      where: {
        isActive: true,
        validFrom: { [Op.lte]: new Date() },
        validUntil: { [Op.gte]: new Date() },
      },
      attributes: [
        "id",
        "code",
        "description",
        "discountType",
        "discountValue",
        "minOrderAmount",
        "validUntil",
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, data: coupons });
  } catch (error) {
    console.error("Get active coupons error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get coupons",
    });
  }
};

// Admin: Create coupon
exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      perUserLimit,
      validFrom,
      validUntil,
      applicableToSellers,
      applicableToCategories,
    } = req.body;

    const existingCoupon = await Coupon.findOne({
      where: { code: code.toUpperCase() },
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount,
      usageLimit,
      perUserLimit: perUserLimit || 1,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      applicableToSellers: applicableToSellers || [],
      applicableToCategories: applicableToCategories || [],
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Create coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create coupon",
    });
  }
};

// Admin: Get all coupons
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.findAll({
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "email", "fullName"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, data: coupons });
  } catch (error) {
    console.error("Get all coupons error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get coupons",
    });
  }
};

// Admin: Update coupon
exports.updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const updates = req.body;

    const coupon = await Coupon.findByPk(couponId);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    if (updates.code) {
      updates.code = updates.code.toUpperCase();
    }

    await coupon.update(updates);

    res.json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Update coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update coupon",
    });
  }
};

// Admin: Delete coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findByPk(couponId);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    await coupon.destroy();

    res.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Delete coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
    });
  }
};

module.exports = exports;
