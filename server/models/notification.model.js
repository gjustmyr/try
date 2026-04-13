const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "order_id",
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [
          [
            "order_placed",
            "order_confirmed",
            "order_processing",
            "order_shipped",
            "order_delivered",
            "order_cancelled",
            "order_failed",
            "delivery_assigned",
            "delivery_picked_up",
            "delivery_in_transit",
            "delivery_out_for_delivery",
            "delivery_at_hub",
            "payment_success",
            "payment_failed",
            "refund_processed",
          ],
        ],
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_read",
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "read_at",
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Notification;
