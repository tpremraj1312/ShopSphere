import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Checkbox from '../../components/ui/Checkbox';
import Badge from '../../components/ui/Badge';
import Price from '../../components/ui/Price';
import Rating from '../../components/ui/Rating';
import { Skeleton, ProductCardSkeleton } from '../../components/ui/Skeleton';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import Toast from '../../components/ui/Toast';
import Pagination from '../../components/ui/Pagination';
import ProductCard from '../../components/ui/ProductCard';
import Tabs from '../../components/ui/Tabs';
import Table from '../../components/ui/Table';
import Stepper from '../../components/ui/Stepper';
import Tooltip from '../../components/ui/Tooltip';
import FormField from '../../components/ui/FormField';
import Textarea from '../../components/ui/Textarea';

export default function UiDemoPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [ratingVal, setRatingVal] = useState(4);
  const [currentPage, setCurrentPage] = useState(1);
  const [checked, setChecked] = useState(true);

  const sampleProduct = {
    id: 'prod-101',
    name: 'Wireless Noise-Canceling Over-Ear Headphones with 30-Hour Battery Life',
    price: 79.99,
    listPrice: 129.99,
    rating: 4.5,
    reviewCount: 1420,
    stock: 15,
    isDeal: true,
    isBestSeller: true,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80'],
  };

  const sampleColumns = [
    { key: 'id', label: 'ID', width: '80px', sortable: true },
    { key: 'name', label: 'Product Name', sortable: true },
    { key: 'price', label: 'Price', align: 'right', sortable: true, render: (val) => <Price amount={val} /> },
    { key: 'status', label: 'Status', render: (val) => <Badge variant={val === 'In Stock' ? 'inStock' : 'lowStock'}>{val}</Badge> },
  ];

  const sampleData = [
    { id: 'SKU-001', name: 'Mechanical Gaming Keyboard', price: 49.99, status: 'In Stock' },
    { id: 'SKU-002', name: 'Ergonomic Vertical Mouse', price: 29.99, status: 'In Stock' },
    { id: 'SKU-003', name: 'USB-C Dual 4K Docking Station', price: 89.99, status: 'Low Stock' },
  ];

  return (
    <div className="page-container py-8 max-w-5xl mx-auto space-y-10">
      <div className="border-b border-[#D5D9D9] pb-4">
        <h1 className="text-[24px] font-medium text-[#0F1111]">ShopSphere UI Component Library (_ui)</h1>
        <p className="text-[13px] text-[#565959] mt-1">
          Catalog of standardized, accessible UI primitives adhering strictly to the Amazon marketplace design tokens.
        </p>
      </div>

      {/* Breadcrumbs */}
      <section className="space-y-2">
        <h2 className="text-[18px] font-semibold text-[#0F1111]">Breadcrumbs</h2>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Electronics', href: '/products?cat=electronics' },
            { label: 'Audio & Accessories' },
          ]}
        />
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#0F1111]">Buttons (Section 2.4)</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary" size="checkout">Place your order (40px)</Button>
          <Button variant="primary" size="form">Add to Cart (36px)</Button>
          <Button variant="primary" size="compact">Compact (32px)</Button>
          <Button variant="buy" size="form">Buy Now</Button>
          <Button variant="secondary" size="form">Secondary Action</Button>
          <Button variant="danger" size="compact">Delete Item</Button>
          <Button variant="link">Text Link Button</Button>
          <Button variant="primary" disabled>Disabled State</Button>
        </div>
      </section>

      {/* Inputs & Forms */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#0F1111]">Form Inputs (Section 2.5)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Email address" placeholder="name@example.com" required />
          <Input label="With Error" defaultValue="invalid input" error="Please enter a valid format." />
          <Select
            label="Department"
            options={[
              { value: 'all', label: 'All Departments' },
              { value: 'computers', label: 'Computers & Tablets' },
              { value: 'books', label: 'Books' },
            ]}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <FormField
            label="Product Description"
            helperText="Provide a clear, detailed overview of the product specifications."
            required
          >
            <Textarea placeholder="Enter product details..." rows={3} />
          </FormField>
          <FormField
            label="Feedback Notes"
            error="Please limit comments to 500 characters."
          >
            <Textarea defaultValue="Extremely satisfied with the delivery and packaging!" rows={3} error="Exceeds character limit" />
          </FormField>
        </div>
        <div className="flex items-center gap-6 mt-2">
          <Checkbox
            label="Eligible for Free Shipping"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            count={142}
          />
          <Checkbox label="Disabled option" disabled />
          <Tooltip content="Verified Amazon Prime-equivalent fast shipping">
            <span className="text-[13px] text-[#007185] cursor-pointer hover:underline">
              Shipping Info Hover
            </span>
          </Tooltip>
        </div>
      </section>

      {/* Price Component */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#0F1111]">Price Component (Section 2.2)</h2>
        <div className="flex items-baseline gap-6 bg-white p-4 border border-[#D5D9D9] rounded-[4px]">
          <Price amount={29.99} />
          <Price amount={199.95} listPrice={249.99} discountPercent={20} />
          <Price amount={4.5} size="sm" />
          <Price amount={1299.0} size="lg" />
        </div>
      </section>

      {/* Rating Component */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#0F1111]">Star Rating (Section 2.6)</h2>
        <div className="flex items-center gap-6 bg-white p-4 border border-[#D5D9D9] rounded-[4px]">
          <div className="flex items-center gap-2">
            <Rating value={4.5} />
            <span className="text-[13px] text-[#007185]">4.5 (823 reviews)</span>
          </div>
          <div className="border-l border-[#D5D9D9] pl-6 flex items-center gap-2">
            <span className="text-[13px] text-[#565959]">Interactive:</span>
            <Rating value={ratingVal} interactive onChange={setRatingVal} />
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#0F1111]">Badges</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="deal">Limited time deal</Badge>
          <Badge variant="bestSeller">#1 Best Seller</Badge>
          <Badge variant="choice">ShopSphere's Choice</Badge>
          <Badge variant="inStock">In Stock</Badge>
          <Badge variant="lowStock">Only 2 left in stock</Badge>
          <Badge variant="neutral">Refurbished</Badge>
        </div>
      </section>

      {/* Stepper */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#0F1111]">Order Status Stepper</h2>
        <div className="bg-white p-6 border border-[#D5D9D9] rounded-[4px]">
          <Stepper currentStep={2} />
        </div>
      </section>

      {/* Tabs */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#0F1111]">Tabs</h2>
        <Tabs
          tabs={[
            { id: 'overview', label: 'Your Orders', count: 12 },
            { id: 'notShipped', label: 'Not Yet Shipped', count: 1 },
            { id: 'cancelled', label: 'Cancelled Orders', count: 0 },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </section>

      {/* Table */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#0F1111]">Marketplace Table (Section 12 & 13)</h2>
        <Table columns={sampleColumns} data={sampleData} />
      </section>

      {/* Product Cards */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#0F1111]">Product Card Variants</h2>
        <div className="space-y-6">
          <h3 className="text-[14px] font-semibold text-[#565959]">List Variant (Search Results)</h3>
          <ProductCard product={sampleProduct} variant="list" />

          <h3 className="text-[14px] font-semibold text-[#565959]">Grid Variant</h3>
          <div className="w-[280px]">
            <ProductCard product={sampleProduct} variant="grid" />
          </div>

          <h3 className="text-[14px] font-semibold text-[#565959]">Rail Variant (Carousels)</h3>
          <div className="p-3 bg-white border border-[#D5D9D9] rounded-[4px] inline-block">
            <ProductCard product={sampleProduct} variant="rail" />
          </div>
        </div>
      </section>

      {/* Skeleton Loaders */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#0F1111]">Skeleton Shimmer Loaders</h2>
        <div className="flex gap-4">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </div>
      </section>

      {/* Modals & Overlays */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#0F1111]">Overlays & Feedback</h2>
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
          <Button variant="secondary" onClick={() => setShowToast(true)}>Trigger Toast</Button>
        </div>

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Choose your delivery location">
          <p className="text-[13px] text-[#565959] mb-4">
            Select a delivery address or enter a US zip code to see item availability and delivery options.
          </p>
          <Button variant="primary" fullWidth onClick={() => setModalOpen(false)}>Apply Location</Button>
        </Modal>

        <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Quick Navigation">
          <p className="text-[13px] text-[#565959]">Slide-in navigation panel adhering to Section 3.B.</p>
        </Drawer>

        {showToast && (
          <Toast
            message="Item successfully added to your shopping cart."
            type="success"
            onClose={() => setShowToast(false)}
          />
        )}
      </section>

      {/* Pagination */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#0F1111]">Pagination</h2>
        <Pagination
          currentPage={currentPage}
          totalPages={5}
          totalItems={120}
          onPageChange={setCurrentPage}
        />
      </section>
    </div>
  );
}
