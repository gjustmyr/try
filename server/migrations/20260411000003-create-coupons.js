module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("coupons", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      discount_type: {
        type: Sequelize.ENUM("percentage", "fixed", "free_shipping"),
        allowNull: false,
      },
      discount_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      min_order_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      max_discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      usage_limit: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      per_user_limit: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      valid_from: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      valid_until: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      applicable_to_sellers: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: [],
      },
      applicable_to_categories: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
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
    await queryInterface.dropTable("coupons");
  },
};
