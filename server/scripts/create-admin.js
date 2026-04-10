const { sequelize } = require("../config/database");
const User = require("../models/user.model");

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const fullName = process.argv[4] || "Admin";

  if (!email || !password) {
    console.log("Usage: node scripts/create-admin.js <email> <password> [fullName]");
    console.log("Example: node scripts/create-admin.js admin@multishop.com admin123 'Super Admin'");
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      if (existing.userType === "admin") {
        // Fix password in case it was double-hashed
        existing.password = password;
        await existing.save();
        console.log(`✓ User "${email}" is already an admin. Password reset.`);
      } else {
        existing.userType = "admin";
        existing.password = password;
        await existing.save();
        console.log(`✓ Updated existing user "${email}" to admin role.`);
      }
    } else {
      await User.create({
        email,
        password,
        fullName,
        userType: "admin",
        emailVerified: true,
        isActive: true,
      });
      console.log(`✓ Admin user created: ${email}`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

createAdmin();
