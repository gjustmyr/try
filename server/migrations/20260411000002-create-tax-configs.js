module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("tax_configs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      tax_type: {
        type: Sequelize.ENUM("vat", "sales_tax", "gst"),
        allowNull: false,
      },
      rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      region: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("tax_configs");
  },
};
