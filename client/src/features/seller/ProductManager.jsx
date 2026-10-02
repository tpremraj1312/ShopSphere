import React, { useState } from 'react';
import {
  useGetSellerProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from '../../store/productsApi';
import Price from '../../components/ui/Price';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { Plus, Edit2, Trash2, Package, AlertCircle } from 'lucide-react';

const FIELD =
  'w-full h-[34px] px-2.5 text-[13px] text-[#0F1111] bg-white border border-[#888C8C] rounded-[3px] ' +
  'shadow-[inset_0_1px_2px_rgba(15,17,17,0.15)] focus:outline-none focus:border-[#E77600] ' +
  'focus:shadow-[0_0_3px_2px_rgba(228,121,17,0.5)]';

const DEFAULT_VARIANT = { sku: 'SKU-001', price: 0, stock: 10, attributes: { type: 'Standard' }, images: [] };
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80';

const Label = ({ children, hint }) => (
  <label className="block text-[13px] font-bold text-[#0F1111] mb-1">
    {children}
    {hint && <span className="ml-1 font-normal text-[#565959]">{hint}</span>}
  </label>
);

export default function ProductManager() {
  const { data, isLoading, error, refetch } = useGetSellerProductsQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryL1, setCategoryL1] = useState('Electronics');
  const [categoryL2, setCategoryL2] = useState('Accessories');
  const [categoryL3, setCategoryL3] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [status, setStatus] = useState('published');
  const [searchKeywords, setSearchKeywords] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Variants
  const [variants, setVariants] = useState([DEFAULT_VARIANT]);

  const updateMainVariant = (patch) =>
    setVariants((prev) => prev.map((v, i) => (i === 0 ? { ...v, ...patch } : v)));

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategoryL1('Electronics');
    setCategoryL2('Accessories');
    setCategoryL3('');
    setBasePrice('');
    setStatus('published');
    setSearchKeywords('');
    setImageUrl('');
    setVariants([DEFAULT_VARIANT]);
    setEditingId(null);
    setErrorMessage('');
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const openEditModal = (product) => {
    setErrorMessage('');
    setEditingId(product._id);
    setTitle(product.title);
    setDescription(product.description || '');
    setCategoryL1(product.category?.l1 || 'Electronics');
    setCategoryL2(product.category?.l2 || 'Accessories');
    setCategoryL3(product.category?.l3 || '');
    setBasePrice(product.basePrice || '');
    setStatus(product.status || 'published');
    setSearchKeywords(product.searchKeywords?.join(', ') || '');
    setImageUrl(product.variants?.[0]?.images?.[0] || product.image || '');

    if (product.variants?.length > 0) {
      setVariants(product.variants);
    } else {
      setVariants([{ sku: 'SKU-001', price: product.basePrice, stock: 10, attributes: {}, images: [] }]);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const formattedVariants = variants.map((v) => ({
      ...v,
      // A single-variant listing always follows the base price
      price: variants.length === 1 ? Number(basePrice) : Number(v.price) || Number(basePrice),
      stock: Number(v.stock) || 0,
      images: imageUrl ? [imageUrl] : v.images || [],
    }));

    const payload = {
      title,
      description,
      category: {
        l1: categoryL1,
        l2: categoryL2,
        ...(categoryL3 && { l3: categoryL3 }),
      },
      basePrice: Number(basePrice),
      status,
      searchKeywords: searchKeywords.split(',').map((k) => k.trim()).filter(Boolean),
      variants: formattedVariants,
    };

    try {
      if (editingId) {
        await updateProduct({ id: editingId, ...payload }).unwrap();
      } else {
        await createProduct(payload).unwrap();
      }
      setIsModalOpen(false);
      resetForm();
      refetch();
    } catch (err) {
      setErrorMessage(err.data?.error?.message || 'Failed to save product listing');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product from your catalog?')) {
      try {
        await deleteProduct(id).unwrap();
        refetch();
      } catch (err) {
        alert(err.data?.error?.message || 'Failed to delete product');
      }
    }
  };

  const products = data?.data || [];
  const isSaving = isCreating || isUpdating;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] sm:text-[28px] leading-8 font-normal text-[#0F1111]">
            Manage product catalog
          </h1>
          <p className="text-[13px] text-[#565959] mt-1">
            Add items, update listings, and keep pricing and stock current.
          </p>
        </div>

        <Button
          variant="primary"
          size="form"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto"
        >
          <Plus size={16} strokeWidth={2} />
          Add a product
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-white border border-[#CC0C39] rounded-[4px] text-[13px] text-[#0F1111]">
          <AlertCircle size={18} className="text-[#CC0C39] shrink-0 mt-px" />
          <div>
            <div className="font-bold text-[#B12704]">There was a problem loading your catalog</div>
            <button type="button" onClick={refetch} className="text-[#007185] hover:text-[#C7511F] hover:underline">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Products table */}
      <div className="bg-white border border-[#D5D9D9] rounded-[4px] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#D5D9D9] bg-[#F7F8F8] text-[13px] text-[#565959]">
          {isLoading ? 'Loading…' : `${products.length} ${products.length === 1 ? 'listing' : 'listings'}`}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#F0F2F2] border-b border-[#D5D9D9]">
              <tr className="text-[#0F1111]">
                <th className="px-4 py-2.5 font-bold">Product</th>
                <th className="px-4 py-2.5 font-bold hidden lg:table-cell">SKU</th>
                <th className="px-4 py-2.5 font-bold">Price</th>
                <th className="px-4 py-2.5 font-bold hidden sm:table-cell">Inventory</th>
                <th className="px-4 py-2.5 font-bold hidden sm:table-cell">Status</th>
                <th className="px-4 py-2.5 font-bold text-right">
                  <span className="sr-only sm:not-sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E7E7]">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-10 rounded-[2px] skeleton" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <Package size={36} strokeWidth={1.25} className="mx-auto text-[#8D9096]" />
                    <p className="mt-3 text-[16px] font-bold text-[#0F1111]">No products listed yet</p>
                    <p className="mt-1 text-[13px] text-[#565959]">Create your first listing to start selling.</p>
                    <Button variant="primary" size="compact" onClick={openCreateModal} className="mt-4">
                      Add your first product
                    </Button>
                  </td>
                </tr>
              ) : (
                products.map((item) => {
                  const mainVariant = item.variants?.[0] || {};
                  const imageSrc = mainVariant.images?.[0] || item.image || FALLBACK_IMG;
                  const totalStock = item.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? 0;
                  const isPublished = item.status === 'active' || item.status === 'published';

                  return (
                    <tr key={item._id} className="hover:bg-[#F7FAFA] transition-colors align-middle">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={imageSrc}
                            alt=""
                            className="w-12 h-12 object-contain bg-white border border-[#D5D9D9] rounded-[2px] p-0.5 shrink-0"
                          />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="block text-left font-medium text-[#007185] hover:text-[#C7511F] hover:underline line-clamp-2 max-w-[16rem] sm:max-w-sm"
                            >
                              {item.title}
                            </button>
                            <div className="text-[12px] text-[#565959] mt-0.5">
                              {item.category?.l1} &gt; {item.category?.l2}
                            </div>
                            <div className="sm:hidden mt-1 text-[12px]">
                              {totalStock > 0 ? (
                                <span className="text-[#007600]">{totalStock} in stock</span>
                              ) : (
                                <span className="text-[#B12704]">Out of stock</span>
                              )}
                              <span className="text-[#565959]"> · {item.status || 'Active'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-[#565959] hidden lg:table-cell">
                        {mainVariant.sku || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <Price amount={item.basePrice || mainVariant.price || 0} size="sm" />
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {totalStock > 0 ? (
                          <span className="text-[#007600]">{totalStock} available</span>
                        ) : (
                          <span className="text-[#B12704] font-medium">Out of stock</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant={isPublished ? 'inStock' : 'neutral'} size="sm">
                          {item.status || 'Active'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="inline-flex items-center justify-center w-9 h-9 text-[#007185] hover:text-[#C7511F] hover:bg-[#F0F2F2] rounded-[3px]"
                          aria-label={`Edit ${item.title}`}
                        >
                          <Edit2 size={16} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          className="inline-flex items-center justify-center w-9 h-9 text-[#B12704] hover:bg-[#FFF0F0] rounded-[3px]"
                          aria-label={`Delete ${item.title}`}
                        >
                          <Trash2 size={16} strokeWidth={1.75} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product create/edit modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit product listing' : 'Add a product'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 bg-white border border-[#CC0C39] rounded-[4px] text-[13px]">
              <AlertCircle size={18} className="text-[#CC0C39] shrink-0 mt-px" />
              <div>
                <div className="font-bold text-[#B12704]">There was a problem</div>
                <div className="text-[#0F1111]">{errorMessage}</div>
              </div>
            </div>
          )}

          <section className="space-y-3">
            <h3 className="text-[16px] font-bold text-[#0F1111]">Product details</h3>

            <Input
              label="Product title"
              required
              placeholder="e.g. Wireless Ergonomic Mouse with USB-C Receiver"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Department</Label>
                <select value={categoryL1} onChange={(e) => setCategoryL1(e.target.value)} className={FIELD}>
                  <option value="Electronics">Electronics</option>
                  <option value="Computers">Computers</option>
                  <option value="Home & Kitchen">Home &amp; Kitchen</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>
              <div>
                <Label>Category</Label>
                <input
                  type="text"
                  placeholder="e.g. Accessories"
                  value={categoryL2}
                  onChange={(e) => setCategoryL2(e.target.value)}
                  className={FIELD}
                />
              </div>
              <div>
                <Label hint="(optional)">Subcategory</Label>
                <input
                  type="text"
                  placeholder="e.g. Mice"
                  value={categoryL3}
                  onChange={(e) => setCategoryL3(e.target.value)}
                  className={FIELD}
                />
              </div>
            </div>

            <div>
              <Label>Description / bullet points</Label>
              <textarea
                rows={4}
                placeholder="Enter key product features, one per line"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${FIELD} h-auto py-2 leading-5`}
              />
            </div>

            <div>
              <Label hint="(comma separated)">Search keywords</Label>
              <input
                type="text"
                placeholder="mouse, wireless, ergonomic"
                value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                className={FIELD}
              />
            </div>
          </section>

          <section className="space-y-3 pt-4 border-t border-[#D5D9D9]">
            <h3 className="text-[16px] font-bold text-[#0F1111]">Price &amp; inventory</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label="Price (₹)"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="499"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
              />
              <div>
                <Label>Quantity</Label>
                <input
                  type="number"
                  min="0"
                  value={variants[0]?.stock ?? 0}
                  onChange={(e) => updateMainVariant({ stock: e.target.value })}
                  className={FIELD}
                />
              </div>
              <div className="col-span-2">
                <Label>SKU</Label>
                <input
                  type="text"
                  value={variants[0]?.sku ?? ''}
                  onChange={(e) => updateMainVariant({ sku: e.target.value })}
                  className={`${FIELD} font-mono`}
                />
              </div>
            </div>

            <div>
              <Label>Listing status</Label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={FIELD}>
                <option value="published">Published – available for purchase</option>
                <option value="draft">Draft – not visible in store</option>
                <option value="unpublished">Unpublished – hidden from store</option>
              </select>
            </div>
          </section>

          <section className="space-y-3 pt-4 border-t border-[#D5D9D9]">
            <h3 className="text-[16px] font-bold text-[#0F1111]">Images</h3>
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 shrink-0 bg-white border border-[#D5D9D9] rounded-[2px] flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                  <Package size={22} strokeWidth={1.25} className="text-[#8D9096]" />
                )}
              </div>
              <div className="flex-1">
                <Input
                  label="Main image URL"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-[#D5D9D9]">
            <Button variant="secondary" size="compact" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" size="compact" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : editingId ? 'Save changes' : 'Publish listing'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}