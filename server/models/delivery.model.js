const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Delivery = sequelize.define(
  "Delivery",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "order_id",
    },
    driverId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "driver_id",
    },
    hubId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "hub_id",
    },
    destinationHubId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "destination_hub_id",
    },
    trackingNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: "tracking_number",
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "pending_drop_off",
      validate: {
        isIn: [
          [
            "pending_drop_off",
            "received_at_hub",
            "in_transit",
            "at_destination_hub",
            "out_for_delivery",
            "delivered",
            "failed",
          ],
        ],
      },
    },
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "qr_code",
    },
    qrSecret: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "qr_secret",
    },
    // Driver's live location during delivery
    currentLatitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: "current_latitude",
    },
    currentLongitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: "current_longitude",
    },
    // Destination (copied from order address for quick access)
    destinationLatitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: "destination_latitude",
    },
    destinationLongitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: "destination_longitude",
    },
    destinationAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "destination_address",
    },
    // Distance in km (calculated hub -> destination)
    distanceKm: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: "distance_km",
    },
    estimatedDelivery: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "estimated_delivery",
    },
    pickedUpAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "picked_up_at",
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "delivered_at",
    },
    customerAcknowledgedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "customer_acknowledged_at",
    },
    autoConfirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "auto_confirmed_at",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "deliveries",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Delivery;
