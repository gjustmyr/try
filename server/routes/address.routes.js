const express = require("express");
const router = express.Router();
const addressController = require("../controllers/address.controller");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/", addressController.getAddresses);
router.post("/", addressController.addAddress);
router.put("/:addressId", addressController.updateAddress);
router.delete("/:addressId", addressController.deleteAddress);
router.patch("/:addressId/default", addressController.setDefault);

module.exports = router;
