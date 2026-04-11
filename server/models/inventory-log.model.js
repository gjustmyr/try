const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const InventoryLog = sequelize.define(
  "InventoryLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "product_id",
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "seller_id",
    },
    type: {
      type: DataTypes.ENUM(
        "sale",
        "restock",
        "adjustment",
        "return",
        "damaged",
        "initial",
      ),
      allowNull: false,
    },
    quantityBefore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "quantity_before",
    },
    quantityChange: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "quantity_change",
    },
    quantityAfter: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "quantity_after",
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "order_id",
    },
    performedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "performed_by",
    },
  },
  {
    tableName: "inventory_logs",
    timestamps: true,
    underscored: true,
  },
);

module.exports = InventoryLog;
