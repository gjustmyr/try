/**
 * Test script to verify PayMongo payment integration setup
 * Run with: node test-payment-setup.js
 */

require("dotenv").config();

console.log("\n🔍 Testing PayMongo Integration Setup...\n");

// Test 1: Check environment variables
console.log("1️⃣ Checking environment variables...");
const hasSecretKey = !!process.env.PAYMONGO_SECRET_KEY;
const hasClientUrl = !!process.env.CLIENT_URL;
const isTestKey = process.env.PAYMONGO_SECRET_KEY?.startsWith("sk_test_");

console.log(
  `   PAYMONGO_SECRET_KEY: ${hasSecretKey ? "✅ Set" : "❌ Missing"}`,
);
if (hasSecretKey && !isTestKey) {
  console.log(
    "   ⚠️  Warning: Not using test key (should start with sk_test_)",
  );
}
console.log(
  `   CLIENT_URL: ${hasClientUrl ? "✅ Set" : "❌ Missing"} (${process.env.CLIENT_URL})`,
);

// Test 2: Check if PayMongo package is installed
console.log("\n2️⃣ Checking PayMongo package...");
try {
  const Paymongo = require("paymongo");
  console.log("   ✅ PayMongo package installed");

  // Test 3: Try to initialize PayMongo
  console.log("\n3️⃣ Testing PayMongo initialization...");
  if (
    hasSecretKey &&
    process.env.PAYMONGO_SECRET_KEY !== "sk_test_your_secret_key_here"
  ) {
    try {
      const paymongo = new Paymongo(process.env.PAYMONGO_SECRET_KEY);
      console.log("   ✅ PayMongo initialized successfully");

      // Test 4: Try a simple API call (list payment intents)
      console.log("\n4️⃣ Testing PayMongo API connection...");
      paymongo.paymentIntents
        .list({ limit: 1 })
        .then(() => {
          console.log("   ✅ PayMongo API connection successful");
          console.log("\n✅ All tests passed! Payment integration is ready.");
          console.log("\n📝 Next steps:");
          console.log(
            "   1. Run database migration: psql -U postgres -d ecommerce -f migrations/add-payment-fields.sql",
          );
          console.log("   2. Restart your server: npm run dev");
          console.log("   3. Test payment endpoints with Postman or curl");
          console.log("   4. Integrate frontend payment UI");
          console.log("\n📖 See PAYMENT_SETUP.md for detailed instructions");
        })
        .catch((error) => {
          console.log("   ❌ PayMongo API connection failed");
          console.log(`   Error: ${error.message}`);
          console.log("\n   Possible issues:");
          console.log("   - Invalid API key");
          console.log("   - Network connection problem");
          console.log("   - PayMongo service down");
        });
    } catch (error) {
      console.log("   ❌ Failed to initialize PayMongo");
      console.log(`   Error: ${error.message}`);
    }
  } else {
    console.log(
      "   ⚠️  Skipped - Please set a valid PAYMONGO_SECRET_KEY in .env",
    );
    console.log("\n⚠️  Setup incomplete. Please:");
    console.log("   1. Sign up at https://dashboard.paymongo.com/");
    console.log("   2. Get your test secret key (starts with sk_test_)");
    console.log("   3. Update PAYMONGO_SECRET_KEY in server/.env");
    console.log("   4. Run this test again");
  }
} catch (error) {
  console.log("   ❌ PayMongo package not installed");
  console.log("   Run: npm install paymongo");
}

// Test 5: Check if payment files exist
console.log("\n5️⃣ Checking payment integration files...");
const fs = require("fs");
const path = require("path");

const files = [
  "services/payment.service.js",
  "controllers/payment.controller.js",
  "routes/payment.routes.js",
  "migrations/add-payment-fields.sql",
];

files.forEach((file) => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`   ${exists ? "✅" : "❌"} ${file}`);
});

// Test 6: Check if routes are registered
console.log("\n6️⃣ Checking if payment routes are registered...");
const serverFile = fs.readFileSync(path.join(__dirname, "server.js"), "utf8");
const hasPaymentRoutes = serverFile.includes("payment.routes");
const hasPaymentUse = serverFile.includes("/api/payment");
console.log(`   ${hasPaymentRoutes ? "✅" : "❌"} Payment routes imported`);
console.log(`   ${hasPaymentUse ? "✅" : "❌"} Payment routes registered`);

console.log("\n" + "=".repeat(60));
