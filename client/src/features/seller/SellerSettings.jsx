import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import {
  Store,
  Truck,
  CreditCard,
  Bell,
  CheckCircle,
  Save,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  Clock,
  RotateCcw,
} from 'lucide-react';

const TABS = [
  { id: 'profile', label: 'Store Profile', icon: Store },
  { id: 'shipping', label: 'Shipping & Fulfillment', icon: Truck },
  { id: 'bank', label: 'Bank & Payouts', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function SellerSettings() {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settings State
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('shopsphere_seller_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      storeName: user?.sellerProfile?.storeName || user?.name ? `${user.name}'s Official Store` : 'ShopSphere Premier Seller',
      tagline: 'Authentic products guaranteed with express dispatch',
      description: 'Authorized retailer providing genuine products with complete manufacturer warranty and fast delivery across India.',
      businessEmail: user?.email || 'seller@shopsphere.in',
      phone: user?.phone || '+91 98765 43210',
      category: 'Electronics & Gadgets',
      gstin: '27AABCU9603R1ZM',
      // Shipping
      fulfillmentModel: 'easyship',
      handlingTime: '1',
      standardShippingFee: '49',
      freeShippingThreshold: '499',
      returnPolicyDays: '7',
      shipFromAddress: 'Plot 42, Electronics Zone, Phase 2, Industrial Area, Bengaluru, Karnataka, 560100',
      // Bank
      bankName: 'HDFC Bank Ltd',
      accountHolder: user?.name || 'Verified Merchant',
      accountNumber: '••••••••8492',
      ifscCode: 'HDFC0001234',
      payoutFrequency: 'weekly',
      // Notifications
      notifyNewOrders: true,
      notifyLowStock: true,
      lowStockThreshold: '10',
      notifyCustomerReviews: true,
      notifyReturns: true,
    };
  });

  const handleChange = (field, val) => {
    setSettings((prev) => ({ ...prev, [field]: val }));
    setSavedSuccess(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      localStorage.setItem('shopsphere_seller_settings', JSON.stringify(settings));
      setIsSubmitting(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    }, 600);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D5D9D9]">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-normal text-[#0F1111] flex items-center gap-2">
            <span>Seller Account Settings</span>
            <span className="inline-flex items-center gap-1 text-[12px] bg-[#007600]/10 text-[#007600] font-medium px-2 py-0.5 rounded border border-[#007600]/20">
              <ShieldCheck size={14} /> Active Merchant
            </span>
          </h1>
          <p className="text-[13px] text-[#565959] mt-1">
            Manage your store information, fulfillment options, banking details, and notifications.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 bg-[#007600]/10 border border-[#007600]/30 text-[#007600] px-3.5 py-1.5 rounded-[4px] text-[13px] font-medium animate-fadeIn">
            <CheckCircle size={16} />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-[#D5D9D9] bg-white rounded-t-[4px] overflow-x-auto shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-5 py-3 text-[13px] font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'border-[#E77600] text-[#0F1111] bg-[#FAFAFA] font-bold'
                  : 'border-transparent text-[#565959] hover:text-[#0F1111] hover:bg-[#F7FAFA]'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[#E77600]' : 'text-[#565959]'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <form onSubmit={handleSave} className="bg-white border border-[#D5D9D9] rounded-b-[4px] p-5 sm:p-7 space-y-6">
        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-5">
            <div className="pb-3 border-b border-[#E7E7E7]">
              <h2 className="text-[16px] font-bold text-[#0F1111]">Store &amp; Business Information</h2>
              <p className="text-[12px] text-[#565959] mt-0.5">
                This information is displayed to buyers on your product pages and public storefront.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-[#0F1111] mb-1">
                  Store Display Name <span className="text-[#C40000]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={settings.storeName}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  className="w-full h-[34px] px-3 text-[13px] border border-[#888C8C] rounded-[4px] focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#0F1111] mb-1">
                  Primary Product Category
                </label>
                <select
                  value={settings.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full h-[34px] px-3 text-[13px] border border-[#888C8C] rounded-[4px] bg-white focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600]"
                >
                  <option value="Electronics & Gadgets">Electronics &amp; Gadgets</option>
                  <option value="Home & Kitchen">Home &amp; Kitchen</option>
                  <option value="Fashion & Apparel">Fashion &amp; Apparel</option>
                  <option value="Beauty & Personal Care">Beauty &amp; Personal Care</option>
                  <option value="Books & Stationery">Books &amp; Stationery</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[13px] font-bold text-[#0F1111] mb-1">
                  Store Tagline / Slogan
                </label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  placeholder="e.g. Authentic products with express delivery"
                  className="w-full h-[34px] px-3 text-[13px] border border-[#888C8C] rounded-[4px] focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[13px] font-bold text-[#0F1111] mb-1">
                  About Store / Description
                </label>
                <textarea
                  rows={3}
                  value={settings.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full p-3 text-[13px] border border-[#888C8C] rounded-[4px] focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#0F1111] mb-1">
                  Official Business Email
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-2.5 text-[#565959]" />
                  <input
                    type="email"
                    value={settings.businessEmail}
                    onChange={(e) => handleChange('businessEmail', e.target.value)}
                    className="w-full h-[34px] pl-9 pr-3 text-[13px] border border-[#888C8C] rounded-[4px] focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#0F1111] mb-1">
                  Customer Support Phone
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-2.5 text-[#565959]" />
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full h-[34px] pl-9 pr-3 text-[13px] border border-[#888C8C] rounded-[4px] focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#0F1111] mb-1">
                  GSTIN / Tax Registration No.
                </label>
                <input
                  type="text"
                  value={settings.gstin}
                  onChange={(e) => handleChange('gstin', e.target.value)}
                  className="w-full h-[34px] px-3 text-[13px] border border-[#888C8C] rounded-[4px] font-mono uppercase focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Shipping */}
        {activeTab === 'shipping' && (
          <div className="space-y-5">
            <div className="pb-3 border-b border-[#E7E7E7]">
              <h2 className="text-[16px] font-bold text-[#0F1111]">Fulfillment &amp; Shipping Preferences</h2>
              <p className="text-[12px] text-[#565959] mt-0.5">
                Configure default handling speed, shipping rates, and customer return policies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[13px] font-bold text-[#0F1111] mb-2">
                  Fulfillment Program
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3.5 border rounded-[4px] cursor-pointer transition-all ${
                      settings.fulfillmentModel === 'easyship'
                        ? 'border-[#007185] bg-[#F0F8FF]'
                        : 'border-[#D5D9D9] hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fulfillmentModel"
                      value="easyship"
                      checked={settings.fulfillmentModel === 'easyship'}
                      onChange={(e) => handleChange('fulfillmentModel', e.target.value)}
                      className="mt-0.5 text-[#007185] focus:ring-[#007185]"
                    />
                    <div>
                      <p className="text-[13px] font-bold text-[#0F1111]">ShopSphere Easy Ship (Recommended)</p>
                      <p className="text-[12px] text-[#565959] mt-0.5">
                        Our carrier partners pick up parcels from your doorstep and deliver to buyers across India with automated tracking.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 border rounded-[4px] cursor-pointer transition-all ${
                      settings.fulfillmentModel === 'selfship'
                        ? 'border-[#007185] bg-[#F0F8FF]'
                        : 'border-[#D5D9D9] hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fulfillmentModel"
                      value="selfship"
                      checked={settings.fulfillmentModel === 'selfship'}
                      onChange={(e) => handleChange('fulfillmentModel', e.target.value)}
                      className="mt-0.5 text-[#007185] focus:ring-[#007185]"
                    />
                    <div>
                      <p className="text-[13px] font-bold text-[#0F1111]">Self-Ship (Merchant Fulfilled)</p>
                      <p className="text-[12px] text-[#565959] mt-0.5">
                        You manage shipping and courier delivery independently using your own logistics partners.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#0F1111] mb-1">
                  Default Handling Time
                </label>
                <div className="relative">
                  <Clock size={15} className="absolute left-3 top-2.5 text-[#565959]" />
                  <select
                    value={settings.handlingTime}
                    onChange={(e) => handleChange('handlingTime', e.target.value)}
                    className="w-full h-[34px] pl-9 pr-3 text-[13px] border border-[#888C8C] rounded-[4px] bg-white focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600]"
                  >
                    <option value="1">Same day or 1 business day</option>
                    <option value="2">2 business days</option>
                    <option value="3">3 business days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#0F1111] mb-1">
                  Customer Return Policy Window
                </label>
                <div className="relative">
                  <RotateCcw size={15} className="absolute left-3 top-2.5 text-[#565959]" />
                  <select
                    value={settings.returnPolicyDays}
                    onChange={(e) => handleChange('returnPolicyDays', e.target.value)}
                    className="w-full h-[34px] pl-9 pr-3 text-[13px] border border-[#888C8C] rounded-[4px] bg-white focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600]"
                  >
                    <option value="7">7 Days Replacement / Return</option>
                    <option value="10">10 Days Return Window</option>
                    <option value="14">14 Days Replacement Window</option>
                    <option value="0">Non-returnable (Consumables/Custom)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#0F1111] mb-1">
                  Standard Shipping Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.standardShippingFee}
                  onChange={(e) => handleChange('standardShippingFee', e.target.value)}
                  className="w-full h-[34px] px-3 text-[13px] border border-[#888C8C] rounded-[4px] focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#0F1111] mb-1">
                  Free Shipping Minimum Order (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.freeShippingThreshold}
                  onChange={(e) => handleChange('freeShippingThreshold', e.target.value)}
                  className="w-full h-[34px] px-3 text-[13px] border border-[#888C8C] rounded-[4px] focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[13px] font-bold text-[#0F1111] mb-1">
                  Warehouse / Dispatch Address
                </label>
                <textarea
                  rows={2}
                  value={settings.shipFromAddress}
                  onChange={(e) => handleChange('shipFromAddress', e.target.value)}
                  className="w-full p-3 text-[13px] border border-[#888C8C] rounded-[4px] focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Bank & Payouts */}
        {activeTab === 'bank' && (
          <div className="space-y-5">
            <div className="pb-3 border-b border-[#E7E7E7]">
              <h2 className="text-[16px] font-bold text-[#0F1111]">Bank Account &amp; Settlement Details</h2>
              <p className="text-[12px] text-[#565959] mt-0.5">
                Bank account where weekly sales payouts and disbursements will be deposited.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-[#0F1111] mb-1">
                  Bank Name
                </label>
                <div className="relative">
                  <Building size={15} className="absolute left-3 top-2.5 text-[#565959]" />
                  <input
                    type="text"
                    value={settings.bankName}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                    className="w-full h-[34px] pl-9 pr-3 text-[13px] border border-[#888C8C] rounded-[4px] focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#0F1111] mb-1">
                  Beneficiary Name
                </label>
                <input
                  type="text"
                  value={settings.accountHolder}
                  onChange={(e) => handleChange('accountHolder', e.target.value)}
                  className="w-full h-[34px] px-3 text-[13px] border border-[#888C8C] rounded-[4px] focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#0F1111] mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={settings.accountNumber}
                  onChange={(e) => handleChange('accountNumber', e.target.value)}
                  className="w-full h-[34px] px-3 text-[13px] border border-[#888C8C] rounded-[4px] font-mono focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#0F1111] mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={settings.ifscCode}
                  onChange={(e) => handleChange('ifscCode', e.target.value)}
                  className="w-full h-[34px] px-3 text-[13px] border border-[#888C8C] rounded-[4px] font-mono uppercase focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#0F1111] mb-1">
                  Disbursement Frequency
                </label>
                <select
                  value={settings.payoutFrequency}
                  onChange={(e) => handleChange('payoutFrequency', e.target.value)}
                  className="w-full h-[34px] px-3 text-[13px] border border-[#888C8C] rounded-[4px] bg-white focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600]"
                >
                  <option value="weekly">Every Monday (Weekly)</option>
                  <option value="biweekly">Every 1st &amp; 16th (Bi-weekly)</option>
                  <option value="monthly">Monthly Cycle</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-5">
            <div className="pb-3 border-b border-[#E7E7E7]">
              <h2 className="text-[16px] font-bold text-[#0F1111]">Notification Preferences</h2>
              <p className="text-[12px] text-[#565959] mt-0.5">
                Choose which real-time alerts you receive for sales, stock warnings, and customer reviews.
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-3 p-3 border border-[#D5D9D9] rounded-[4px] hover:bg-[#F9F9F9] cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifyNewOrders}
                  onChange={(e) => handleChange('notifyNewOrders', e.target.checked)}
                  className="mt-1 h-4 w-4 text-[#007185] rounded border-[#888C8C] focus:ring-[#007185]"
                />
                <div>
                  <p className="text-[13px] font-bold text-[#0F1111]">New Customer Order Alerts</p>
                  <p className="text-[12px] text-[#565959]">
                    Receive instant notifications and email confirmation as soon as an order is placed.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-[#D5D9D9] rounded-[4px] hover:bg-[#F9F9F9] cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifyLowStock}
                  onChange={(e) => handleChange('notifyLowStock', e.target.checked)}
                  className="mt-1 h-4 w-4 text-[#007185] rounded border-[#888C8C] focus:ring-[#007185]"
                />
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-[#0F1111]">Low Inventory Warning</p>
                  <p className="text-[12px] text-[#565959]">
                    Notify when SKU stock falls below the threshold to avoid out-of-stock cancellations.
                  </p>
                  {settings.notifyLowStock && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[12px] text-[#565959]">Alert threshold:</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={settings.lowStockThreshold}
                        onChange={(e) => handleChange('lowStockThreshold', e.target.value)}
                        className="w-16 h-7 px-2 text-[12px] border border-[#888C8C] rounded focus:outline-none focus:border-[#E77600]"
                      />
                      <span className="text-[12px] text-[#565959]">units</span>
                    </div>
                  )}
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-[#D5D9D9] rounded-[4px] hover:bg-[#F9F9F9] cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifyCustomerReviews}
                  onChange={(e) => handleChange('notifyCustomerReviews', e.target.checked)}
                  className="mt-1 h-4 w-4 text-[#007185] rounded border-[#888C8C] focus:ring-[#007185]"
                />
                <div>
                  <p className="text-[13px] font-bold text-[#0F1111]">Product Reviews &amp; Ratings</p>
                  <p className="text-[12px] text-[#565959]">
                    Get notified when customers leave new star ratings and reviews on your listings.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-[#D5D9D9] rounded-[4px] hover:bg-[#F9F9F9] cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifyReturns}
                  onChange={(e) => handleChange('notifyReturns', e.target.checked)}
                  className="mt-1 h-4 w-4 text-[#007185] rounded border-[#888C8C] focus:ring-[#007185]"
                />
                <div>
                  <p className="text-[13px] font-bold text-[#0F1111]">Returns &amp; Replacement Inquiries</p>
                  <p className="text-[12px] text-[#565959]">
                    Alerts for customer return authorizations, buyer messages, and dispute resolutions.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="pt-4 border-t border-[#E7E7E7] flex items-center justify-end gap-3">
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className="flex items-center gap-2 !px-6 !py-2 text-[13px]"
          >
            <Save size={15} />
            <span>Save Settings</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
