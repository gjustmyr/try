/**
 * Auto-Confirm Deliveries Job
 *
 * This script automatically confirms deliveries that have been delivered
 * for 7+ days without customer acknowledgment.
 *
 * Run manually: node jobs/auto-confirm-deliveries.js
 * Or set up as a cron job to run daily
 */

const { Delivery } = require("../models");
const { Op } = require("sequelize");

async function autoConfirmDeliveries() {
  console.log("Starting auto-confirm deliveries job...");
  console.log(`Current time: ${new Date().toISOString()}`);

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log(
      `Looking for deliveries delivered before: ${sevenDaysAgo.toISOString()}`,
    );

    // Find deliveries that were delivered 7+ days ago and not yet acknowledged
    const deliveries = await Delivery.findAll({
      where: {
        status: "delivered",
        deliveredAt: {
          [Op.lte]: sevenDaysAgo,
        },
        customerAcknowledgedAt: null,
        autoConfirmedAt: null,
      },
    });

    console.log(`Found ${deliveries.length} deliveries to auto-confirm`);

    if (deliveries.length === 0) {
      console.log("No deliveries need auto-confirmation");
      process.exit(0);
    }

    let confirmed = 0;
    let errors = 0;

    for (const delivery of deliveries) {
      try {
        console.log(
          `Auto-confirming delivery ${delivery.id} (tracking: ${delivery.trackingNumber}, delivered: ${delivery.deliveredAt})`,
        );

        await delivery.update({
          autoConfirmedAt: new Date(),
        });

        confirmed++;
        console.log(`✓ Confirmed delivery ${delivery.id}`);
      } catch (error) {
        errors++;
        console.error(
          `✗ Failed to auto-confirm delivery ${delivery.id}:`,
          error.message,
        );
      }
    }

    console.log("\n=== Auto-Confirm Complete ===");
    console.log(`Total found: ${deliveries.length}`);
    console.log(`Confirmed: ${confirmed}`);
    console.log(`Errors: ${errors}`);

    process.exit(0);
  } catch (error) {
    console.error("Auto-confirm job failed:", error);
    process.exit(1);
  }
}

// Run the job
autoConfirmDeliveries();
