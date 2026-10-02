import React, { useState } from 'react';
import {
  useGetAddressesQuery,
  useAddAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} from '../store/orderApi';
import { MapPin, Plus, Trash2, CheckCircle2, X } from 'lucide-react';
import Button from './ui/Button';

export default function AddressModal({ isOpen, onClose, onSelectAddress }) {
  const { data: addressesData, isLoading } = useGetAddressesQuery();
  const [addAddress, { isLoading: isAdding }] = useAddAddressMutation();
  const [deleteAddress, { isLoading: isDeleting }] = useDeleteAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState(null);
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });

  if (!isOpen) return null;

  const addresses = addressesData?.data || [];

  const handleSelectDefault = async (address) => {
    try {
      await setDefaultAddress(address._id).unwrap();
      if (onSelectAddress) {
        onSelectAddress(address);
      }
    } catch (err) {
      console.error('Failed to set default address:', err);
    }
  };

  const handleDelete = async (e, addressId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this address?')) {
      try {
        await deleteAddress(addressId).unwrap();
      } catch (err) {
        console.error('Failed to delete address:', err);
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.postalCode) {
      setFormError('Please fill in all required address fields.');
      return;
    }

    try {
      const res = await addAddress(newAddress).unwrap();
      setShowAddForm(false);
      const created = Array.isArray(res?.data)
        ? res.data[res.data.length - 1]
        : res?.data;

      if (onSelectAddress && created) {
        onSelectAddress(created);
      }

      setNewAddress({
        name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        isDefault: false,
      });
    } catch (err) {
      setFormError(err?.data?.error?.message || err?.data?.message || 'Failed to save address.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#232F3E] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-base font-semibold">
            <MapPin size={18} className="text-[#FFD814]" />
            <span>Choose your delivery location</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[80vh] overflow-y-auto space-y-4 text-[#0F1111]">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-[#565959]">
              Loading saved addresses...
            </div>
          ) : addresses.length === 0 && !showAddForm ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#F0F2F2] flex items-center justify-center mx-auto text-[#007185]">
                <MapPin size={24} />
              </div>
              <h3 className="text-sm font-semibold">No addresses saved yet</h3>
              <p className="text-xs text-[#565959] max-w-xs mx-auto">
                Add a delivery address to enable fast 1-click checkout and personalized delivery estimates.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="mt-2 inline-flex items-center gap-1.5"
              >
                <Plus size={16} /> Add your first address
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {!showAddForm && (
                <div className="space-y-2.5">
                  <div className="text-xs text-[#565959] font-medium uppercase tracking-wider">
                    Select a delivery address
                  </div>
                  {addresses.map((addr) => {
                    const isDefault = Boolean(addr.isDefault);
                    return (
                      <div
                        key={addr._id}
                        onClick={() => handleSelectDefault(addr)}
                        className={`p-3.5 border rounded-[4px] cursor-pointer transition-all flex items-start justify-between gap-3 ${
                          isDefault
                            ? 'border-[#007185] bg-[#F4FBFB] ring-1 ring-[#007185]'
                            : 'border-[#D5D9D9] hover:border-[#A6A6A6] hover:bg-[#FAFAFA]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="selectedAddress"
                            checked={isDefault}
                            onChange={() => handleSelectDefault(addr)}
                            className="mt-1 accent-[#007185] cursor-pointer"
                          />
                          <div className="text-xs leading-relaxed">
                            <div className="font-semibold text-sm text-[#0F1111] flex items-center gap-2">
                              <span>{addr.name || 'Recipient'}</span>
                              {isDefault && (
                                <span className="text-[10px] uppercase font-bold text-[#007600] bg-[#E7F4E8] px-1.5 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-[#333333] mt-0.5">
                              {addr.street}
                            </div>
                            <div className="text-[#565959]">
                              {addr.city}, {addr.state} - {addr.postalCode}
                            </div>
                            {addr.phone && (
                              <div className="text-[#565959] mt-0.5">
                                Phone: {addr.phone}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, addr._id)}
                          disabled={isDeleting}
                          title="Delete address"
                          className="text-[#565959] hover:text-[#B12704] p-1.5 rounded transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(true)}
                      className="w-full py-2.5 px-3 border border-dashed border-[#007185] rounded-[4px] text-xs font-semibold text-[#007185] hover:bg-[#F0F8FF] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus size={16} /> Add a new address
                    </button>
                  </div>
                </div>
              )}

              {/* Add Address Form */}
              {showAddForm && (
                <form onSubmit={handleFormSubmit} className="space-y-3 pt-1">
                  <div className="flex items-center justify-between border-b border-[#E7E7E7] pb-2 mb-2">
                    <h3 className="text-sm font-bold text-[#0F1111]">
                      Add a new delivery address
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setFormError(null);
                      }}
                      className="text-xs text-[#007185] hover:underline"
                    >
                      Cancel
                    </button>
                  </div>

                  {formError && (
                    <div className="p-2.5 bg-[#FFF0F0] border-l-4 border-l-[#B12704] text-[12px] text-[#B12704] rounded-[2px]">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#0F1111] mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.name}
                        onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-2.5 py-1.5 text-xs border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#007185] focus:ring-1 focus:ring-[#007185]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#0F1111] mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        placeholder="10-digit mobile number"
                        className="w-full px-2.5 py-1.5 text-xs border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#007185] focus:ring-1 focus:ring-[#007185]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#0F1111] mb-1">
                      Street Address / Flat / Building *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      placeholder="e.g. 102, Palm Heights, Main Link Road"
                      className="w-full px-2.5 py-1.5 text-xs border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#007185] focus:ring-1 focus:ring-[#007185]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#0F1111] mb-1">
                        City / Town *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        placeholder="e.g. Mumbai"
                        className="w-full px-2.5 py-1.5 text-xs border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#007185] focus:ring-1 focus:ring-[#007185]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#0F1111] mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        placeholder="e.g. Maharashtra"
                        className="w-full px-2.5 py-1.5 text-xs border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#007185] focus:ring-1 focus:ring-[#007185]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#0F1111] mb-1">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.postalCode}
                        onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                        placeholder="6-digit PIN code"
                        className="w-full px-2.5 py-1.5 text-xs border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#007185] focus:ring-1 focus:ring-[#007185]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#0F1111] mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value={newAddress.country}
                        onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-[#A6A6A6] bg-gray-50 rounded-[3px]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="default-address-cb"
                      checked={newAddress.isDefault}
                      onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                      className="rounded accent-[#007185] cursor-pointer"
                    />
                    <label htmlFor="default-address-cb" className="text-xs text-[#0F1111] cursor-pointer">
                      Use as my default delivery address
                    </label>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={isAdding}
                    >
                      {isAdding ? 'Saving address...' : 'Add address'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 text-xs text-[#565959] hover:text-[#0F1111]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#F0F2F2] px-5 py-3 flex justify-end border-t border-[#D5D9D9]">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
