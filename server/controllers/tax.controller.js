const { TaxConfig } = require("../models");

// Get active tax configuration
exports.getActiveTax = async (req, res) => {
  try {
    const { region } = req.query;

    const where = { isActive: true };
    if (region) {
      where.region = region;
    }

    const taxConfig = await TaxConfig.findOne({
      where,
      order: [["createdAt", "DESC"]],
    });

    if (!taxConfig) {
      return res.json({
        success: true,
        data: { rate: 0, name: "No Tax", taxType: "none" },
      });
    }

    res.json({ success: true, data: taxConfig });
  } catch (error) {
    console.error("Get active tax error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get tax configuration",
    });
  }
};

// Admin: Create tax configuration
exports.createTaxConfig = async (req, res) => {
  try {
    const { name, taxType, rate, region } = req.body;

    const taxConfig = await TaxConfig.create({
      name,
      taxType,
      rate,
      region,
    });

    res.status(201).json({
      success: true,
      message: "Tax configuration created successfully",
      data: taxConfig,
    });
  } catch (error) {
    console.error("Create tax config error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create tax configuration",
    });
  }
};

// Admin: Get all tax configurations
exports.getAllTaxConfigs = async (req, res) => {
  try {
    const taxConfigs = await TaxConfig.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, data: taxConfigs });
  } catch (error) {
    console.error("Get all tax configs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get tax configurations",
    });
  }
};

// Admin: Update tax configuration
exports.updateTaxConfig = async (req, res) => {
  try {
    const { taxId } = req.params;
    const updates = req.body;

    const taxConfig = await TaxConfig.findByPk(taxId);
    if (!taxConfig) {
      return res.status(404).json({
        success: false,
        message: "Tax configuration not found",
      });
    }

    await taxConfig.update(updates);

    res.json({
      success: true,
      message: "Tax configuration updated successfully",
      data: taxConfig,
    });
  } catch (error) {
    console.error("Update tax config error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update tax configuration",
    });
  }
};

// Admin: Delete tax configuration
exports.deleteTaxConfig = async (req, res) => {
  try {
    const { taxId } = req.params;

    const taxConfig = await TaxConfig.findByPk(taxId);
    if (!taxConfig) {
      return res.status(404).json({
        success: false,
        message: "Tax configuration not found",
      });
    }

    await taxConfig.destroy();

    res.json({
      success: true,
      message: "Tax configuration deleted successfully",
    });
  } catch (error) {
    console.error("Delete tax config error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete tax configuration",
    });
  }
};

module.exports = exports;
