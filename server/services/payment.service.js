const Paymongo = require("paymongo");

// Initialize PayMongo with your secret key
const paymongo = new Paymongo(process.env.PAYMONGO_SECRET_KEY);

/**
 * Create a payment intent for online payment
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in centavos (e.g., 10000 = ₱100.00)
 * @param {string} params.description - Payment description
 * @param {Object} params.metadata - Additional data (orderId, userId, etc.)
 * @returns {Promise<Object>} Payment intent object
 */
exports.createPaymentIntent = async ({ amount, description, metadata }) => {
  try {
    const paymentIntent = await paymongo.paymentIntents.create({
      data: {
        attributes: {
          amount: Math.round(amount * 100), // Convert to centavos
          payment_method_allowed: ["card", "gcash", "paymaya", "grab_pay"],
          payment_method_options: {
            card: { request_three_d_secure: "any" },
          },
          currency: "PHP",
          description,
          statement_descriptor: "MegaShop Order",
          metadata,
        },
      },
    });

    return {
      success: true,
      data: paymentIntent.data,
    };
  } catch (error) {
    console.error("Create payment intent error:", error);
    return {
      success: false,
      message: error.message || "Failed to create payment intent",
    };
  }
};

/**
 * Create a payment method (for card payments)
 * @param {Object} params - Card details
 * @param {string} params.cardNumber - Card number
 * @param {number} params.expMonth - Expiry month
 * @param {number} params.expYear - Expiry year
 * @param {string} params.cvc - Card CVC
 * @param {Object} params.billingDetails - Billing information
 * @returns {Promise<Object>} Payment method object
 */
exports.createPaymentMethod = async ({
  cardNumber,
  expMonth,
  expYear,
  cvc,
  billingDetails,
}) => {
  try {
    const paymentMethod = await paymongo.paymentMethods.create({
      data: {
        attributes: {
          type: "card",
          details: {
            card_number: cardNumber,
            exp_month: expMonth,
            exp_year: expYear,
            cvc,
          },
          billing: billingDetails,
        },
      },
    });

    return {
      success: true,
      data: paymentMethod.data,
    };
  } catch (error) {
    console.error("Create payment method error:", error);
    return {
      success: false,
      message: error.message || "Failed to create payment method",
    };
  }
};

/**
 * Attach payment method to payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Promise<Object>} Updated payment intent
 */
exports.attachPaymentIntent = async (paymentIntentId, paymentMethodId) => {
  try {
    const paymentIntent = await paymongo.paymentIntents.attach(
      paymentIntentId,
      {
        data: {
          attributes: {
            payment_method: paymentMethodId,
            return_url: `${process.env.CLIENT_URL}/payment/callback`,
          },
        },
      },
    );

    return {
      success: true,
      data: paymentIntent.data,
    };
  } catch (error) {
    console.error("Attach payment intent error:", error);
    return {
      success: false,
      message: error.message || "Failed to attach payment method",
    };
  }
};

/**
 * Create a GCash payment source
 * @param {number} amount - Amount in pesos
 * @param {Object} metadata - Order metadata
 * @returns {Promise<Object>} Payment source with redirect URL
 */
exports.createGCashPayment = async (amount, metadata) => {
  try {
    const source = await paymongo.sources.create({
      data: {
        attributes: {
          type: "gcash",
          amount: Math.round(amount * 100), // Convert to centavos
          currency: "PHP",
          redirect: {
            success: `${process.env.CLIENT_URL}/payment/success`,
            failed: `${process.env.CLIENT_URL}/payment/failed`,
          },
          metadata,
        },
      },
    });

    return {
      success: true,
      data: source.data,
      checkoutUrl: source.data.attributes.redirect.checkout_url,
    };
  } catch (error) {
    console.error("Create GCash payment error:", error);
    return {
      success: false,
      message: error.message || "Failed to create GCash payment",
    };
  }
};

/**
 * Create a PayMaya payment source
 * @param {number} amount - Amount in pesos
 * @param {Object} metadata - Order metadata
 * @returns {Promise<Object>} Payment source with redirect URL
 */
exports.createPayMayaPayment = async (amount, metadata) => {
  try {
    const source = await paymongo.sources.create({
      data: {
        attributes: {
          type: "paymaya",
          amount: Math.round(amount * 100),
          currency: "PHP",
          redirect: {
            success: `${process.env.CLIENT_URL}/payment/success`,
            failed: `${process.env.CLIENT_URL}/payment/failed`,
          },
          metadata,
        },
      },
    });

    return {
      success: true,
      data: source.data,
      checkoutUrl: source.data.attributes.redirect.checkout_url,
    };
  } catch (error) {
    console.error("Create PayMaya payment error:", error);
    return {
      success: false,
      message: error.message || "Failed to create PayMaya payment",
    };
  }
};

/**
 * Retrieve payment intent status
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<Object>} Payment intent with status
 */
exports.getPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent =
      await paymongo.paymentIntents.retrieve(paymentIntentId);

    return {
      success: true,
      data: paymentIntent.data,
      status: paymentIntent.data.attributes.status,
    };
  } catch (error) {
    console.error("Get payment intent error:", error);
    return {
      success: false,
      message: error.message || "Failed to retrieve payment intent",
    };
  }
};

/**
 * Retrieve payment source status (for GCash/PayMaya)
 * @param {string} sourceId - Source ID
 * @returns {Promise<Object>} Source with status
 */
exports.getPaymentSource = async (sourceId) => {
  try {
    const source = await paymongo.sources.retrieve(sourceId);

    return {
      success: true,
      data: source.data,
      status: source.data.attributes.status,
    };
  } catch (error) {
    console.error("Get payment source error:", error);
    return {
      success: false,
      message: error.message || "Failed to retrieve payment source",
    };
  }
};

/**
 * Create a payment (to capture funds from a source)
 * @param {string} sourceId - Source ID
 * @param {number} amount - Amount in pesos
 * @param {Object} metadata - Payment metadata
 * @returns {Promise<Object>} Payment object
 */
exports.createPayment = async (sourceId, amount, metadata) => {
  try {
    const payment = await paymongo.payments.create({
      data: {
        attributes: {
          amount: Math.round(amount * 100),
          currency: "PHP",
          source: {
            id: sourceId,
            type: "source",
          },
          description: metadata.description || "MegaShop Order Payment",
          statement_descriptor: "MegaShop",
          metadata,
        },
      },
    });

    return {
      success: true,
      data: payment.data,
    };
  } catch (error) {
    console.error("Create payment error:", error);
    return {
      success: false,
      message: error.message || "Failed to create payment",
    };
  }
};

module.exports = exports;
