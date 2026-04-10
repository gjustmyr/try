const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const bcrypt = require("bcryptjs");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "full_name",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userType: {
      type: DataTypes.ENUM("customer", "seller", "admin", "driver"),
      allowNull: false,
      defaultValue: "customer",
      field: "user_type",
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "email_verified",
    },
    emailVerificationOtp: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "email_verification_otp",
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "email_verification_expires",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_login",
    },
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  },
);

// Instance method to compare password
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate verification OTP
User.prototype.generateVerificationOtp = async function () {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP with bcrypt
  const salt = await bcrypt.genSalt(10);
  this.emailVerificationOtp = await bcrypt.hash(otp, salt);
  this.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  return otp; // Return plain OTP to send via email
};

// Instance method to verify OTP
User.prototype.verifyOtp = async function (candidateOtp) {
  if (!this.emailVerificationOtp) {
    return false;
  }

  // Check if OTP is expired
  if (new Date() > this.emailVerificationExpires) {
    return false;
  }

  return await bcrypt.compare(candidateOtp, this.emailVerificationOtp);
};

module.exports = User;
