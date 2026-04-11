const express = require("express");
const router = express.Router();
const taxController = require("../controllers/tax.controller");
const { authenticate, authorize } = require("../middleware/auth");

// Public: Get active tax
router.get("/active", taxController.getActiveTax);

// Admin: Tax management
router.post(
  "/",
  authenticate,
  authorize("admin"),
  taxController.createTaxConfig,
);
router.get(
  "/",
  authenticate,
  authorize("admin"),
  taxController.getAllTaxConfigs,
);
router.put(
  "/:taxId",
  authenticate,
  authorize("admin"),
  taxController.updateTaxConfig,
);
router.delete(
  "/:taxId",
  authenticate,
  authorize("admin"),
  taxController.deleteTaxConfig,
);

module.exports = router;
