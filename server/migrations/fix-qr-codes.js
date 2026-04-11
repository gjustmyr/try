/**
 * Migration Script: Fix QR Codes
 *
 * This script regenerates QR codes for existing deliveries to use deliveryId instead of orderId
 *
 * Run with: node server/migrations/fix-qr-codes.js
 */

const QRCode = require("qrcode");
const { Delivery } = require("../models");
const { Op } = require("sequelize");

async function fixQRCodes() {
  console.log("Starting QR code migration...");

  try {
    // Find all deliveries that have a QR code
    const deliveries = await Delivery.findAll({
      where: {
        qrCode: { [Op.ne]: null },
      },
    });

    console.log(`Found ${deliveries.length} deliveries with QR codes`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const delivery of deliveries) {
      try {
        // Always regenerate QR codes to ensure correct format
        console.log(
          `Regenerating QR code for delivery ${delivery.id} (tracking: ${delivery.trackingNumber})`,
        );

        // Generate new QR code with correct format
        const qrData = JSON.stringify({
          deliveryId: delivery.id,
          trackingNumber: delivery.trackingNumber,
          secret: delivery.qrSecret,
        });

        const qrCodeImage = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 2,
        });

        // Update delivery
        await delivery.update({ qrCode: qrCodeImage });
        updated++;
        console.log(`✓ Updated delivery ${delivery.id}`);
      } catch (error) {
        errors++;
        console.error(
          `✗ Error updating delivery ${delivery.id}:`,
          error.message,
        );
      }
    }

    console.log("\n=== Migration Complete ===");
    console.log(`Total deliveries: ${deliveries.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
fixQRCodes();
