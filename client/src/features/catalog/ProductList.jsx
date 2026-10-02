import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useGetProductsQuery,
  useGetCategoriesQuery,
  useGetFacetsQuery,
} from '../../store/productsApi';
import { useAddToCartMutation } from '../../store/cartApi';
import FilterSidebar from './FilterSidebar';
import ProductCard from '../../components/ui/ProductCard';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Toast from '../../components/ui/Toast';
import { X } from 'lucide-react';

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [addToCart] = useAddToCartMutation();
  const [toastMessage, setToastMessage] = useState(null);

  const searchParam = searchParams.get('search') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const sortParam = searchParams.get('sort') || 'relevance';
  const l1Param = searchParams.get('categoryL1') || searchParams.get('category') || '';
  const l2Param = searchParams.get('categoryL2') || '';
  const minRatingParam = searchParams.get('minRating') || '';
  const inStockParam = searchParams.get('inStockOnly') || '';
  const brandParam = searchParams.get('brand') || '';
  const discountParam = searchParams.get('discount') || '';

  const queryParams = {
    sort: sortParam,
    ...(l1Param && { categoryL1: l1Param }),
    ...(l2Param && { categoryL2: l2Param }),
    ...(searchParam && { search: searchParam }),
    ...(minPriceParam && { minPrice: minPriceParam }),
    ...(maxPriceParam && { maxPrice: maxPriceParam }),
    ...(minRatingParam && { minRating: minRatingParam }),
    ...(inStockParam && { inStockOnly: inStockParam }),
    ...(brandParam && { brand: brandParam }),
  };

  const { data: productsData, isLoading, error } = useGetProductsQuery(queryParams);
  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: facetsData } = useGetFacetsQuery({
    categoryL1: l1Param,
    search: searchParam,
  });

  const products = productsData?.data || [];
  const totalResults = productsData?.total || products.length;

  const handleCategorySelect = (l1, l2 = '') => {
    const newParams = new URLSearchParams(searchParams);
    if (l1) newParams.set('categoryL1', l1);
    else newParams.delete('categoryL1');
    if (l2) newParams.set('categoryL2', l2);
    else newParams.delete('categoryL2');
    newParams.delete('category');
    setSearchParams(newParams);
  };

  const handlePriceChange = (min, max) => {
    const newParams = new URLSearchParams(searchParams);
    if (min) newParams.set('minPrice', min);
    else newParams.delete('minPrice');
    if (max) newParams.set('maxPrice', max);
    else newParams.delete('maxPrice');
    setSearchParams(newParams);
  };

  const handleRatingChange = (rating) => {
    const newParams = new URLSearchParams(searchParams);
    if (rating) newParams.set('minRating', rating);
    else newParams.delete('minRating');
    setSearchParams(newParams);
  };

  const handleInStockToggle = (checked) => {
    const newParams = new URLSearchParams(searchParams);
    if (checked) newParams.set('inStockOnly', 'true');
    else newParams.delete('inStockOnly');
    setSearchParams(newParams);
  };

  const handleBrandChange = (brand) => {
    const newParams = new URLSearchParams(searchParams);
    if (brand.trim()) newParams.set('brand', brand.trim());
    else newParams.delete('brand');
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', newSort);
    setSearchParams(newParams);
  };

  const handleDiscountChange = (newDiscount) => {
    const newParams = new URLSearchParams(searchParams);
    if (newDiscount) newParams.set('discount', newDiscount);
    else newParams.delete('discount');
    setSearchParams(newParams);
  };

  const handleClearAll = () => {
    const newParams = new URLSearchParams();
    if (searchParam) newParams.set('search', searchParam);
    setSearchParams(newParams);
  };

  const removeFilter = (key) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(key);
    if (key === 'categoryL1') {
      newParams.delete('categoryL2');
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  const handleAddToCart = async (product) => {
    try {
      const productId = product.id || product._id;
      await addToCart({ productId, qty: 1 }).unwrap();
      setToastMessage(`Added "${product.name || product.title}" to cart.`);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      const errorMsg = err?.data?.error?.message || err?.message || 'Failed to add item to cart. Please try again.';
      setToastMessage(errorMsg);
    }
  };

  return (
    <div className="bg-white min-h-[calc(100vh-280px)] border-b border-[#D5D9D9]">
      {/* Top Results Header Bar */}
      <div className="border-b border-[#D5D9D9] bg-[#F7FAFA] py-2.5 px-4 sm:px-6">
        <div className="max-w-[1500px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[13px]">
          <div>
            <span className="text-[#0F1111]">
              {isLoading ? (
                'Searching products...'
              ) : (
                <>
                  1-{products.length} of {totalResults > products.length ? `over ${totalResults}` : totalResults} results
                  {searchParam && (
                    <>
                      {' '}for <span className="font-semibold text-[#B12704]">"{searchParam}"</span>
                    </>
                  )}
                  {l1Param && (
                    <>
                      {' '}in <span className="font-semibold text-[#0F1111]">"{l1Param}"</span>
                    </>
                  )}
                </>
              )}
            </span>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <label htmlFor="sort-select" className="text-[#565959] text-[13px] whitespace-nowrap">
              Sort by:
            </label>
            <select
              id="sort-select"
              value={sortParam}
              onChange={(e) => handleSortChange(e.target.value)}
              className="h-[30px] px-2 text-[12px] bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] rounded-[3px] text-[#0F1111] cursor-pointer focus:outline-none focus:border-[#E77600]"
            >
              <option value="relevance">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Avg. Customer Review</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-4 flex flex-col lg:flex-row gap-6">
        {/* Left Sticky Sidebar (240px) */}
        <FilterSidebar
          categories={categoriesData?.data || []}
          facets={facetsData?.data || {}}
          selectedL1={l1Param}
          selectedL2={l2Param}
          onCategorySelect={handleCategorySelect}
          minPrice={minPriceParam}
          maxPrice={maxPriceParam}
          onPriceChange={handlePriceChange}
          minRating={minRatingParam}
          onRatingChange={handleRatingChange}
          inStockOnly={inStockParam}
          onInStockToggle={handleInStockToggle}
          brand={brandParam}
          onBrandChange={handleBrandChange}
          discount={discountParam}
          onDiscountChange={handleDiscountChange}
          onClearAll={handleClearAll}
        />

        {/* Right Search Results Area */}
        <div className="flex-1 min-w-0">
          {/* Active Filter Chips */}
          {(l1Param || minPriceParam || maxPriceParam || minRatingParam || inStockParam || brandParam || discountParam) && (
            <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-[#D5D9D9]">
              <span className="text-[12px] text-[#565959]">Active Filters:</span>
              {l1Param && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F0F2F2] border border-[#D5D9D9] rounded-[3px] text-[12px] text-[#0F1111]">
                  Department: {l1Param}
                  <button onClick={() => removeFilter('categoryL1')} className="text-[#565959] hover:text-[#0F1111]">
                    <X size={13} strokeWidth={2} />
                  </button>
                </span>
              )}
              {minPriceParam && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F0F2F2] border border-[#D5D9D9] rounded-[3px] text-[12px] text-[#0F1111]">
                  Min: ${minPriceParam}
                  <button onClick={() => removeFilter('minPrice')} className="text-[#565959] hover:text-[#0F1111]">
                    <X size={13} strokeWidth={2} />
                  </button>
                </span>
              )}
              {maxPriceParam && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F0F2F2] border border-[#D5D9D9] rounded-[3px] text-[12px] text-[#0F1111]">
                  Max: ${maxPriceParam}
                  <button onClick={() => removeFilter('maxPrice')} className="text-[#565959] hover:text-[#0F1111]">
                    <X size={13} strokeWidth={2} />
                  </button>
                </span>
              )}
              {minRatingParam && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F0F2F2] border border-[#D5D9D9] rounded-[3px] text-[12px] text-[#0F1111]">
                  {minRatingParam}★ & Up
                  <button onClick={() => removeFilter('minRating')} className="text-[#565959] hover:text-[#0F1111]">
                    <X size={13} strokeWidth={2} />
                  </button>
                </span>
              )}
              {brandParam && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F0F2F2] border border-[#D5D9D9] rounded-[3px] text-[12px] text-[#0F1111]">
                  Brand: {brandParam}
                  <button onClick={() => removeFilter('brand')} className="text-[#565959] hover:text-[#0F1111]">
                    <X size={13} strokeWidth={2} />
                  </button>
                </span>
              )}
              {discountParam && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F0F2F2] border border-[#D5D9D9] rounded-[3px] text-[12px] text-[#0F1111]">
                  Deal: {discountParam === 'deals' ? "Today's Deals" : `${discountParam}% Off+`}
                  <button onClick={() => removeFilter('discount')} className="text-[#565959] hover:text-[#0F1111]">
                    <X size={13} strokeWidth={2} />
                  </button>
                </span>
              )}
              <button
                onClick={handleClearAll}
                className="text-[12px] text-[#007185] hover:text-[#C7511F] hover:underline font-medium ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Results List */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 border border-[#D5D9D9] rounded-[4px] p-4 flex gap-4">
                  <div className="w-[200px] h-full bg-[#F0F2F2] rounded-[3px] skeleton" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-3/4 skeleton rounded-[2px]" />
                    <div className="h-4 w-1/4 skeleton rounded-[2px]" />
                    <div className="h-6 w-1/5 skeleton rounded-[2px]" />
                    <div className="h-8 w-28 skeleton rounded-[3px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-[#B12704] bg-white border border-[#D5D9D9] rounded-[4px]">
              Failed to load search results. Please try again.
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No results found"
              description={`No products matched your search criteria${searchParam ? ` for "${searchParam}"` : ''}. Try checking your spelling or using more general terms.`}
              actionLabel="Clear all filters"
              onAction={handleClearAll}
            />
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id || product._id}
                  product={product}
                  variant="list"
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
