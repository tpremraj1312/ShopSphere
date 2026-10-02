import React, { useState, useEffect } from 'react';
import { useGetProductsQuery } from '../../store/productsApi';
import ProductRail from './ProductRail';

/**
 * RecentlyViewedRail adhering to Section 4.5:
 * Reads product IDs from localStorage ('shopsphere_recently_viewed').
 * Hidden if empty.
 */
export default function RecentlyViewedRail() {
  const [recentIds, setRecentIds] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('shopsphere_recently_viewed');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentIds(parsed.slice(0, 12));
        }
      }
    } catch (e) {
      console.error('Failed to parse recently viewed items', e);
    }
  }, []);

  const { data: productsData, isLoading } = useGetProductsQuery(
    { limit: 12 },
    { skip: recentIds.length === 0 }
  );

  if (recentIds.length === 0) return null;

  const allProducts = productsData?.data || [];
  const recentProducts = recentIds
    .map((id) => allProducts.find((p) => (p.id || p._id) === id))
    .filter(Boolean);

  if (!isLoading && recentProducts.length === 0) return null;

  const handleClear = () => {
    localStorage.removeItem('shopsphere_recently_viewed');
    setRecentIds([]);
  };

  return (
    <div className="relative">
      <ProductRail
        title="Recently Viewed Items"
        subtitle="Based on your browsing history"
        products={recentProducts}
        isLoading={isLoading}
        linkText="Clear history"
        linkTo="#"
        onAddToCart={() => {}}
      />
      <button
        onClick={handleClear}
        className="absolute top-4 right-4 text-[12px] text-[#007185] hover:text-[#C7511F] hover:underline z-10"
      >
        Clear history
      </button>
    </div>
  );
}
