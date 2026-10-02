const User = require('./user.model');

class AddressService {
  /**
   * Get all addresses for a user
   */
  async getAddresses(userId) {
    const user = await User.findById(userId).select('addresses');
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }
    return user.addresses || [];
  }

  /**
   * Add a new address to user's profile (CART-FR-03)
   */
  async addAddress(userId, addressData) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    if (!user.addresses) {
      user.addresses = [];
    }

    // If this is the user's first address, make it default automatically
    const isFirstAddress = user.addresses.length === 0;
    const shouldBeDefault = addressData.isDefault || isFirstAddress;

    if (shouldBeDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      ...addressData,
      isDefault: shouldBeDefault
    });

    await user.save();
    return user.addresses;
  }

  /**
   * Update an existing address
   */
  async updateAddress(userId, addressId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      const error = new Error('Address not found');
      error.statusCode = 404;
      error.code = 'ADDRESS_NOT_FOUND';
      throw error;
    }

    if (updateData.isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    Object.assign(address, updateData);
    await user.save();
    return user.addresses;
  }

  /**
   * Delete an address
   */
  async deleteAddress(userId, addressId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      const error = new Error('Address not found');
      error.statusCode = 404;
      error.code = 'ADDRESS_NOT_FOUND';
      throw error;
    }

    const wasDefault = address.isDefault;
    user.addresses.pull({ _id: addressId });

    // If we removed the default address, make the first remaining address default if any exist
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return user.addresses;
  }

  /**
   * Set an address as default
   */
  async setDefaultAddress(userId, addressId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      const error = new Error('Address not found');
      error.statusCode = 404;
      error.code = 'ADDRESS_NOT_FOUND';
      throw error;
    }

    user.addresses.forEach(addr => {
      addr.isDefault = addr._id.toString() === addressId.toString();
    });

    await user.save();
    return user.addresses;
  }
}

module.exports = new AddressService();
