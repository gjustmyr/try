const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const { authenticate } = require("../middleware/auth");

// All cart routes require authentication
router.use(authenticate);

router.get("/", cartController.getCart);
router.post("/add", cartController.addToCart);
router.put("/item/:itemId", cartController.updateCartItem);
router.delete("/item/:itemId", cartController.removeFromCart);
router.delete("/clear", cartController.clearCart);
router.get("/count", cartController.getCartCount);

module.exports = router;
