const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const CouponUsage = sequelize.define(
  "CouponUsage",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    couponId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "coupons",
        key: "id",
      },
      field: "coupon_id",
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      field: "user_id",
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "orders",
        key: "id",
      },
      field: "order_id",
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "discount_amount",
    },
  },
  {
    tableName: "coupon_usages",
    timestamps: true,
    underscored: true,
  },
);

module.exports = CouponUsage;
