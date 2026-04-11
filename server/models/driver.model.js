const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Driver = sequelize.define(
	"Driver",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		userId: {
			type: DataTypes.UUID,
			allowNull: false,
			unique: true,
			field: "user_id",
		},
		fullName: {
			type: DataTypes.STRING,
			allowNull: false,
			field: "full_name",
		},
		phone: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		vehicleType: {
			type: DataTypes.ENUM("motorcycle", "car", "van", "truck"),
			allowNull: false,
			field: "vehicle_type",
		},
		plateNumber: {
			type: DataTypes.STRING,
			allowNull: false,
			field: "plate_number",
		},
		licenseNumber: {
			type: DataTypes.STRING,
			allowNull: false,
			field: "license_number",
		},
		isAvailable: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			field: "is_available",
		},
		isActive: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			field: "is_active",
		},
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
		hubId: {
			type: DataTypes.UUID,
			allowNull: true,
			field: "hub_id",
		},
	},
	{
		tableName: "drivers",
		timestamps: true,
		underscored: true,
	},
);

module.exports = Driver;
