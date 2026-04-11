const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Review = sequelize.define(
  "Review",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "products",
        key: "id",
      },
      field: "product_id",
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "sellers",
        key: "id",
      },
      field: "seller_id",
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.JSONB),
      defaultValue: [],
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "orders",
        key: "id",
      },
      field: "order_id",
    },
  },
  {
    tableName: "reviews",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Review;
