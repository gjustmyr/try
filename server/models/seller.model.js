const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Seller = sequelize.define(
  "Seller",
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
      references: {
        model: "users",
        key: "id",
      },
      field: "user_id",
    },
    shopName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "shop_name",
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
    businessType: {
      type: DataTypes.ENUM("individual", "company"),
      allowNull: false,
      field: "business_type",
    },
    businessRegNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "business_reg_number",
    },
    businessAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "business_address",
    },
    // Document URLs from Cloudinary
    governmentIdUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "government_id_url",
    },
    governmentIdPublicId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "government_id_public_id",
    },
    businessLicenseUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "business_license_url",
    },
    businessLicensePublicId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "business_license_public_id",
    },
    proofOfAddressUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "proof_of_address_url",
    },
    proofOfAddressPublicId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "proof_of_address_public_id",
    },
    taxCertificateUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "tax_certificate_url",
    },
    taxCertificatePublicId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "tax_certificate_public_id",
    },
    // Approval status
    approvalStatus: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
      field: "approval_status",
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "approved_at",
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      field: "approved_by",
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "rejection_reason",
    },
    // Shop settings
    shopDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "shop_description",
    },
    shopLogo: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "shop_logo",
    },
    shopBanner: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "shop_banner",
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.0,
      validate: {
        min: 0,
        max: 5,
      },
    },
    totalSales: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "total_sales",
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_verified",
    },
  },
  {
    tableName: "sellers",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Seller;
