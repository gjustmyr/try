const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    compareAtPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "compare_at_price",
    },
    costPerItem: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "cost_per_item",
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    barcode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.JSONB),
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM("active", "draft", "archived"),
      defaultValue: "draft",
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_published",
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    weightUnit: {
      type: DataTypes.ENUM("kg", "g", "lb", "oz"),
      defaultValue: "kg",
      field: "weight_unit",
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    sales: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "products",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Product;
