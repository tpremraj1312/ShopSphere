const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const addressService = require('../../src/modules/users/address.service');
const User = require('../../src/modules/users/user.model');

describe('Address Management Service (CART-FR-03, Step 2.5.6)', () => {
  let mockUser;

  beforeEach(() => {
    mockUser = {
      _id: 'user123',
      addresses: [],
      save: async function () { return this; }
    };
    // Mock Mongoose subdocument helper functions
    mockUser.addresses.id = function (id) {
      return this.find(a => a._id.toString() === id.toString());
    };
    mockUser.addresses.pull = function (query) {
      const idx = this.findIndex(a => a._id.toString() === query._id.toString());
      if (idx !== -1) this.splice(idx, 1);
    };

    User.findById = async (id) => {
      if (id === 'user123') return mockUser;
      return null;
    };
  });

  it('addAddress makes first address default automatically', async () => {
    const addresses = await addressService.addAddress('user123', {
      _id: 'addr1',
      street: '123 Main St',
      city: 'Metropolis',
      state: 'NY',
      postalCode: '10001',
      country: 'USA'
    });

    assert.strictEqual(addresses.length, 1);
    assert.strictEqual(addresses[0].isDefault, true);
    assert.strictEqual(addresses[0].street, '123 Main St');
  });

  it('addAddress with isDefault=true unsets previous default address', async () => {
    mockUser.addresses.push({
      _id: 'addr1',
      street: '123 Main St',
      city: 'Metropolis',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
      isDefault: true
    });

    const addresses = await addressService.addAddress('user123', {
      _id: 'addr2',
      street: '456 Second Ave',
      city: 'Metropolis',
      state: 'NY',
      postalCode: '10002',
      country: 'USA',
      isDefault: true
    });

    assert.strictEqual(addresses.length, 2);
    const addr1 = addresses.find(a => a._id === 'addr1');
    const addr2 = addresses.find(a => a._id === 'addr2');
    assert.strictEqual(addr1.isDefault, false);
    assert.strictEqual(addr2.isDefault, true);
  });

  it('setDefaultAddress updates default flag across addresses', async () => {
    mockUser.addresses.push(
      { _id: 'addr1', street: '123 Main St', isDefault: true },
      { _id: 'addr2', street: '456 Second Ave', isDefault: false }
    );

    const addresses = await addressService.setDefaultAddress('user123', 'addr2');
    assert.strictEqual(addresses[0].isDefault, false);
    assert.strictEqual(addresses[1].isDefault, true);
  });

  it('deleteAddress promotes first remaining address if default address is removed', async () => {
    mockUser.addresses.push(
      { _id: 'addr1', street: '123 Main St', isDefault: true },
      { _id: 'addr2', street: '456 Second Ave', isDefault: false }
    );

    const addresses = await addressService.deleteAddress('user123', 'addr1');
    assert.strictEqual(addresses.length, 1);
    assert.strictEqual(addresses[0]._id, 'addr2');
    assert.strictEqual(addresses[0].isDefault, true);
  });
});
