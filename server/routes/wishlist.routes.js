const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlist.controller");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/", wishlistController.getWishlist);
router.post("/", wishlistController.addToWishlist);
router.delete("/:productId", wishlistController.removeFromWishlist);
router.get("/check/:productId", wishlistController.checkWishlist);

module.exports = router;
