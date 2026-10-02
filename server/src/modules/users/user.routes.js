const express = require('express');
const router = express.Router();
const addressController = require('./address.controller');
const requireAuth = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const {
  addAddressSchema,
  updateAddressSchema,
  deleteAddressSchema
} = require('./address.validation');

// All address routes require authentication (CART-FR-03, Step 2.5.6)
router.get('/addresses', requireAuth, addressController.getAddresses.bind(addressController));
router.post(
  '/addresses',
  requireAuth,
  validate(addAddressSchema),
  addressController.addAddress.bind(addressController)
);
router.put(
  '/addresses/:addressId',
  requireAuth,
  validate(updateAddressSchema),
  addressController.updateAddress.bind(addressController)
);
router.delete(
  '/addresses/:addressId',
  requireAuth,
  validate(deleteAddressSchema),
  addressController.deleteAddress.bind(addressController)
);
router.put(
  '/addresses/:addressId/default',
  requireAuth,
  validate(deleteAddressSchema), // reuses params validation for addressId
  addressController.setDefaultAddress.bind(addressController)
);

module.exports = router;
