const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const TaxConfig = sequelize.define(
  "TaxConfig",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    taxType: {
      type: DataTypes.ENUM("vat", "sales_tax", "gst"),
      allowNull: false,
      field: "tax_type",
    },
    rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "tax_configs",
    timestamps: true,
    underscored: true,
  },
);

module.exports = TaxConfig;
