module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("orders", "tax_amount", {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
      after: "subtotal",
    });

    await queryInterface.addColumn("orders", "tax_rate", {
      type: Sequelize.DECIMAL(5, 2),
      defaultValue: 0,
      after: "tax_amount",
    });

    await queryInterface.addColumn("orders", "discount_amount", {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
      after: "tax_rate",
    });

    await queryInterface.addColumn("orders", "coupon_code", {
      type: Sequelize.STRING,
      allowNull: true,
      after: "discount_amount",
    });

    await queryInterface.addColumn("orders", "shipping_discount", {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
      after: "shipping_fee",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("orders", "tax_amount");
    await queryInterface.removeColumn("orders", "tax_rate");
    await queryInterface.removeColumn("orders", "discount_amount");
    await queryInterface.removeColumn("orders", "coupon_code");
    await queryInterface.removeColumn("orders", "shipping_discount");
  },
};
