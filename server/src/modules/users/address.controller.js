const addressService = require('./address.service');
const { sendSuccess } = require('../../shared/response');

class AddressController {
  async getAddresses(req, res, next) {
    try {
      const addresses = await addressService.getAddresses(req.user._id);
      return sendSuccess(res, addresses);
    } catch (error) {
      next(error);
    }
  }

  async addAddress(req, res, next) {
    try {
      const addresses = await addressService.addAddress(req.user._id, req.body);
      return sendSuccess(res, addresses, null, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateAddress(req, res, next) {
    try {
      const addresses = await addressService.updateAddress(
        req.user._id,
        req.params.addressId,
        req.body
      );
      return sendSuccess(res, addresses);
    } catch (error) {
      next(error);
    }
  }

  async deleteAddress(req, res, next) {
    try {
      const addresses = await addressService.deleteAddress(
        req.user._id,
        req.params.addressId
      );
      return sendSuccess(res, addresses);
    } catch (error) {
      next(error);
    }
  }

  async setDefaultAddress(req, res, next) {
    try {
      const addresses = await addressService.setDefaultAddress(
        req.user._id,
        req.params.addressId
      );
      return sendSuccess(res, addresses);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AddressController();
