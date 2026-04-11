const { User, Seller } = require("../models");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../utils/email");

exports.findUserByEmail = async (email) => {
  const { DeliveryHub } = require("../models");
  return User.findOne({
    where: { email },
    include: [
      {
        model: Seller,
        as: "sellerProfile",
        attributes: ["id", "shopName", "approvalStatus", "isVerified"],
      },
      {
        model: DeliveryHub,
        as: "hubProfile",
        attributes: ["id", "name", "address", "city", "province", "phone"],
      },
    ],
  });
};

exports.findUserById = async (id) => {
  return User.findByPk(id, {
    attributes: [
      "id",
      "fullName",
      "email",
      "userType",
      "emailVerified",
      "isActive",
    ],
    include: [
      {
        model: Seller,
        as: "sellerProfile",
        attributes: [
          "id",
          "shopName",
          "fullName",
          "phone",
          "approvalStatus",
          "isVerified",
          "rating",
          "totalSales",
        ],
      },
    ],
  });
};

exports.generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      userType: user.userType,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

exports.updateLastLogin = async (user) => {
  user.lastLogin = new Date();
  await user.save();
};

exports.buildLoginResponse = (user, token) => {
  const responseData = {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      userType: user.userType,
      emailVerified: user.emailVerified,
    },
  };

  if (user.userType === "seller" && user.sellerProfile) {
    responseData.seller = {
      id: user.sellerProfile.id,
      shopName: user.sellerProfile.shopName,
      approvalStatus: user.sellerProfile.approvalStatus,
      isVerified: user.sellerProfile.isVerified,
    };
  }

  if (user.userType === "hub" && user.hubProfile) {
    responseData.hub = {
      id: user.hubProfile.id,
      name: user.hubProfile.name,
      address: user.hubProfile.address,
      city: user.hubProfile.city,
      province: user.hubProfile.province,
    };
  }

  return responseData;
};

exports.createUser = async ({ fullName, email, password }) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw { status: 409, message: "Email already registered" };
  }

  const user = await User.create({
    fullName,
    email,
    password,
    userType: "customer",
    emailVerified: false,
  });

  const otp = await user.generateVerificationOtp();
  await user.save();
  await sendOtpEmail(email, otp);

  return user;
};

exports.verifyUserEmail = async (email, otp) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  if (user.emailVerified) {
    throw { status: 400, message: "Email already verified" };
  }

  const isValid = await user.verifyOtp(otp);
  if (!isValid) {
    throw { status: 400, message: "Invalid or expired OTP" };
  }

  user.emailVerified = true;
  user.emailVerificationOtp = null;
  user.emailVerificationExpires = null;
  await user.save();

  return user;
};

exports.resendUserOtp = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  if (user.emailVerified) {
    throw { status: 400, message: "Email already verified" };
  }

  const otp = await user.generateVerificationOtp();
  await user.save();
  await sendOtpEmail(email, otp);

  return user;
};
