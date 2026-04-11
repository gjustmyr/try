const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Coupon = sequelize.define(
  "Coupon",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isUppercase: true,
        len: [3, 20],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    discountType: {
      type: DataTypes.ENUM("percentage", "fixed", "free_shipping"),
      allowNull: false,
      field: "discount_type",
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "discount_value",
    },
    minOrderAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: "min_order_amount",
    },
    maxDiscountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "max_discount_amount",
    },
    usageLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "usage_limit",
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "usage_count",
    },
    perUserLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: "per_user_limit",
    },
    validFrom: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "valid_from",
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "valid_until",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    applicableToSellers: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
      field: "applicable_to_sellers",
    },
    applicableToCategories: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      field: "applicable_to_categories",
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      field: "created_by",
    },
  },
  {
    tableName: "coupons",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Coupon;
