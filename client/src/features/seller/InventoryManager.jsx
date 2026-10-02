import React, { useState, useMemo } from 'react';
import { useGetSellerProductsQuery, useUpdateProductMutation } from '../../store/productsApi';
import { useGetInventoryQuery, useUpdateSkuStockMutation } from '../../store/sellerApi';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import {
  Search,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
  AlertCircle,
  Edit3,
  ArrowUpDown,
} from 'lucide-react';

const FIELD =
  'w-full h-[34px] px-2.5 text-[13px] text-[#0F1111] bg-white border border-[#888C8C] rounded-[3px] ' +
  'shadow-[inset_0_1px_2px_rgba(15,17,17,0.15)] focus:outline-none focus:border-[#E77600] ' +
  'focus:shadow-[0_0_3px_2px_rgba(228,121,17,0.5)]';

const STOCK_FILTERS = [
  { key: 'all', label: 'All Items' },
  { key: 'inStock', label: 'In Stock' },
  { key: 'low', label: 'Low Stock' },
  { key: 'out', label: 'Out of Stock' },
];

function getStockStatus(stock) {
  if (stock <= 0) return { label: 'Out of Stock', variant: 'outOfStock', key: 'out' };
  if (stock < 10) return { label: 'Low Stock', variant: 'neutral', key: 'low' };
  return { label: 'In Stock', variant: 'inStock', key: 'inStock' };
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80';

export default function InventoryManager() {
  const { data: productsData, isLoading, error, refetch } = useGetSellerProductsQuery();
  const { data: inventoryData } = useGetInventoryQuery();
  const [updateSkuStock, { isLoading: isStockUpdating }] = useUpdateSkuStockMutation();
  const [updateProduct] = useUpdateProductMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [editingStock, setEditingStock] = useState({}); // { [productId_variantIdx]: newStock }
  const [saveSuccess, setSaveSuccess] = useState({});
  const [sortBy, setSortBy] = useState('stock');
  const [sortDir, setSortDir] = useState('asc');

  // Build inventory items from products data
  const inventoryItems = useMemo(() => {
    const products = productsData?.data || [];
    const items = [];

    for (const product of products) {
      if (product.variants?.length > 0) {
        product.variants.forEach((variant, idx) => {
          items.push({
            productId: product._id,
            variantIdx: idx,
            variantId: variant._id,
            title: product.title,
            sku: variant.sku || 'N/A',
            stock: variant.stock || 0,
            price: variant.price || product.basePrice || 0,
            image: variant.images?.[0] || product.images?.[0] || FALLBACK_IMG,
            category: product.category,
            status: product.status,
            attributes: variant.attributes,
          });
        });
      } else {
        items.push({
          productId: product._id,
          variantIdx: 0,
          title: product.title,
          sku: 'N/A',
          stock: 0,
          price: product.basePrice || 0,
          image: product.images?.[0] || FALLBACK_IMG,
          category: product.category,
          status: product.status,
        });
      }
    }

    return items;
  }, [productsData]);

  // Filter and sort
  const filteredItems = useMemo(() => {
    let result = [...inventoryItems];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q)
      );
    }

    // Stock filter
    if (stockFilter !== 'all') {
      result = result.filter((item) => getStockStatus(item.stock).key === stockFilter);
    }

    // Sort
    result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'stock') return (a.stock - b.stock) * dir;
      if (sortBy === 'title') return a.title.localeCompare(b.title) * dir;
      if (sortBy === 'price') return (a.price - b.price) * dir;
      return 0;
    });

    return result;
  }, [inventoryItems, searchQuery, stockFilter, sortBy, sortDir]);

  // Stats
  const stats = useMemo(() => {
    const total = inventoryItems.length;
    const outOfStock = inventoryItems.filter((i) => i.stock <= 0).length;
    const lowStock = inventoryItems.filter((i) => i.stock > 0 && i.stock < 10).length;
    const healthy = total - outOfStock - lowStock;
    return { total, outOfStock, lowStock, healthy };
  }, [inventoryItems]);

  const getItemKey = (item) => `${item.productId}_${item.variantIdx}`;

  const handleStockChange = (item, newValue) => {
    const key = getItemKey(item);
    setEditingStock((prev) => ({ ...prev, [key]: newValue }));
  };

  const handleStockSave = async (item) => {
    const key = getItemKey(item);
    const newStock = Number(editingStock[key]);
    if (isNaN(newStock) || newStock < 0) return;

    try {
      // Try the dedicated inventory endpoint first
      if (item.variantId) {
        await updateSkuStock({
          productId: item.productId,
          variantId: item.variantId,
          stock: newStock,
        }).unwrap();
      }
    } catch {
      // Fallback: update product variant directly
      try {
        const product = productsData?.data?.find((p) => p._id === item.productId);
        if (product) {
          const updatedVariants = [...(product.variants || [])];
          if (updatedVariants[item.variantIdx]) {
            updatedVariants[item.variantIdx] = {
              ...updatedVariants[item.variantIdx],
              stock: newStock,
            };
          }
          await updateProduct({
            id: item.productId,
            variants: updatedVariants,
          }).unwrap();
        }
      } catch (err) {
        alert(err.data?.error?.message || 'Failed to update stock');
        return;
      }
    }

    setEditingStock((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSaveSuccess((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setSaveSuccess((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    }), 2000);
    refetch();
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] sm:text-[28px] leading-8 font-normal text-[#0F1111]">
            Inventory Management
          </h1>
          <p className="text-[13px] text-[#565959] mt-1">
            Monitor stock levels and update inventory across your catalog.
          </p>
        </div>
        <Button
          variant="secondary"
          size="form"
          onClick={refetch}
          className="inline-flex items-center justify-center gap-1.5"
        >
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#D5D9D9] rounded-[8px] p-3 text-center">
          <div className="text-[22px] font-bold text-[#0F1111]">{stats.total}</div>
          <div className="text-[11px] text-[#565959] mt-0.5">Total SKUs</div>
        </div>
        <div className="bg-white border border-[#D5D9D9] rounded-[8px] p-3 text-center">
          <div className="text-[22px] font-bold text-[#007600]">{stats.healthy}</div>
          <div className="text-[11px] text-[#565959] mt-0.5 flex items-center justify-center gap-1">
            <CheckCircle size={10} className="text-[#007600]" /> Healthy
          </div>
        </div>
        <div className="bg-white border border-[#D5D9D9] rounded-[8px] p-3 text-center">
          <div className="text-[22px] font-bold text-[#C45500]">{stats.lowStock}</div>
          <div className="text-[11px] text-[#565959] mt-0.5 flex items-center justify-center gap-1">
            <AlertTriangle size={10} className="text-[#C45500]" /> Low Stock
          </div>
        </div>
        <div className="bg-white border border-[#D5D9D9] rounded-[8px] p-3 text-center">
          <div className="text-[22px] font-bold text-[#B12704]">{stats.outOfStock}</div>
          <div className="text-[11px] text-[#565959] mt-0.5 flex items-center justify-center gap-1">
            <XCircle size={10} className="text-[#B12704]" /> Out of Stock
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#565959]" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${FIELD} pl-9`}
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {STOCK_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStockFilter(f.key)}
              className={`px-3 py-2 rounded-[3px] text-[12px] font-medium whitespace-nowrap transition-colors ${
                stockFilter === f.key
                  ? 'bg-[#232F3E] text-white'
                  : 'bg-[#F0F2F2] text-[#565959] hover:bg-[#E3E6E6]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-white border border-[#CC0C39] rounded-[4px] text-[13px]">
          <AlertCircle size={18} className="text-[#CC0C39] shrink-0 mt-px" />
          <div>
            <div className="font-bold text-[#B12704]">Failed to load inventory</div>
            <button type="button" onClick={refetch} className="text-[#007185] hover:underline">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white border border-[#D5D9D9] rounded-[8px] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#D5D9D9] bg-[#F7F8F8] text-[13px] text-[#565959]">
          {isLoading ? 'Loading…' : `${filteredItems.length} ${filteredItems.length === 1 ? 'SKU' : 'SKUs'}`}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#F0F2F2] border-b border-[#D5D9D9]">
              <tr className="text-[#0F1111]">
                <th className="px-4 py-2.5 font-bold">
                  <button onClick={() => toggleSort('title')} className="flex items-center gap-1 hover:text-[#007185]">
                    Product <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-4 py-2.5 font-bold hidden md:table-cell">SKU</th>
                <th className="px-4 py-2.5 font-bold">
                  <button onClick={() => toggleSort('stock')} className="flex items-center gap-1 hover:text-[#007185]">
                    Stock <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-4 py-2.5 font-bold hidden sm:table-cell">Status</th>
                <th className="px-4 py-2.5 font-bold">
                  <button onClick={() => toggleSort('price')} className="flex items-center gap-1 hover:text-[#007185]">
                    Price <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-4 py-2.5 font-bold text-right">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E7E7]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-12 rounded-[2px] skeleton" />
                    </td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <Package size={36} strokeWidth={1.25} className="mx-auto text-[#8D9096]" />
                    <p className="mt-3 text-[16px] font-bold text-[#0F1111]">No inventory items</p>
                    <p className="mt-1 text-[13px] text-[#565959]">
                      {searchQuery || stockFilter !== 'all'
                        ? 'Try adjusting your filters.'
                        : 'Add products to start tracking inventory.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const key = getItemKey(item);
                  const stockStatus = getStockStatus(item.stock);
                  const isEditing = key in editingStock;
                  const saved = saveSuccess[key];

                  return (
                    <tr key={key} className="hover:bg-[#F7FAFA] transition-colors align-middle">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt=""
                            className="w-10 h-10 object-contain bg-white border border-[#D5D9D9] rounded-[2px] p-0.5 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-[13px] text-[#0F1111] font-medium line-clamp-1">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-[#565959] mt-0.5">
                              {item.category?.l1} &gt; {item.category?.l2}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-[#565959] hidden md:table-cell">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={editingStock[key]}
                              onChange={(e) => handleStockChange(item, e.target.value)}
                              className="w-20 h-[30px] px-2 text-[13px] bg-white border border-[#E77600] rounded-[3px] text-center focus:outline-none focus:shadow-[0_0_3px_2px_rgba(228,121,17,0.5)]"
                              autoFocus
                            />
                          ) : (
                            <span className={`font-medium ${
                              item.stock <= 0 ? 'text-[#B12704]' : item.stock < 10 ? 'text-[#C45500]' : 'text-[#0F1111]'
                            }`}>
                              {item.stock}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant={stockStatus.variant} size="sm">
                          {stockStatus.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[#0F1111]">
                        ₹{item.price.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {saved ? (
                          <span className="inline-flex items-center gap-1 text-[12px] text-[#007600] font-medium">
                            <CheckCircle size={14} /> Saved
                          </span>
                        ) : isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingStock((prev) => {
                                  const next = { ...prev };
                                  delete next[key];
                                  return next;
                                });
                              }}
                              className="px-2 h-[28px] text-[12px] text-[#565959] hover:text-[#0F1111] border border-[#D5D9D9] rounded-[3px]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleStockSave(item)}
                              disabled={isStockUpdating}
                              className="inline-flex items-center gap-1 px-2.5 h-[28px] text-[12px] font-medium text-white bg-[#007185] hover:bg-[#005F6B] rounded-[3px] disabled:opacity-50"
                            >
                              <Save size={12} /> Save
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStockChange(item, String(item.stock))}
                            className="inline-flex items-center gap-1 px-2.5 h-[28px] text-[12px] font-medium text-[#007185] border border-[#D5D9D9] hover:bg-[#F0F2F2] rounded-[3px]"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}