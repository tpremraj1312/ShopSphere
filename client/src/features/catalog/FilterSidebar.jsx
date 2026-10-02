import React, { useState, useMemo } from 'react';
import Rating from '../../components/ui/Rating';
import Checkbox from '../../components/ui/Checkbox';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

/**
 * Collapsible filter section with animated expand/collapse.
 */
function FilterSection({ title, defaultOpen = true, children, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`pt-3 border-t border-[#D5D9D9] ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full text-left mb-2 group"
      >
        <h3 className="font-semibold text-[14px] text-[#0F1111] group-hover:text-[#C7511F] transition-colors">
          {title}
        </h3>
        {open ? (
          <ChevronUp size={16} className="text-[#565959]" />
        ) : (
          <ChevronDown size={16} className="text-[#565959]" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * FilterSidebar — Professional Amazon-style faceted navigation with:
 * - Collapsible accordion sections
 * - Department tree (L1 → L2 drill-down)
 * - Customer Reviews (star ratings)
 * - Price presets + custom range
 * - Brand facet with search/filter
 * - Discount filter
 * - Availability toggle
 */
export default function FilterSidebar({
  categories = [],
  facets = {},
  selectedL1,
  selectedL2,
  onCategorySelect,
  minPrice,
  maxPrice,
  onPriceChange,
  minRating,
  onRatingChange,
  inStockOnly,
  onInStockToggle,
  brand,
  onBrandChange,
  discount = '',
  onDiscountChange,
  onClearAll,
}) {
  const [minInput, setMinInput] = useState(minPrice || '');
  const [maxInput, setMaxInput] = useState(maxPrice || '');
  const [brandSearch, setBrandSearch] = useState('');

  React.useEffect(() => {
    setMinInput(minPrice || '');
  }, [minPrice]);

  React.useEffect(() => {
    setMaxInput(maxPrice || '');
  }, [maxPrice]);

  const handlePriceSubmit = (e) => {
    e.preventDefault();
    onPriceChange(minInput, maxInput);
  };

  const hasActiveFilters = Boolean(
    selectedL1 ||
    selectedL2 ||
    minPrice ||
    maxPrice ||
    minRating ||
    inStockOnly ||
    brand
  );

  const pricePresets = [
    { label: 'Under $25', min: '', max: '25' },
    { label: '$25 to $50', min: '25', max: '50' },
    { label: '$50 to $100', min: '50', max: '100' },
    { label: '$100 to $200', min: '100', max: '200' },
    { label: '$200 to $500', min: '200', max: '500' },
    { label: '$500 & Above', min: '500', max: '' },
  ];

  const ratingOptions = [4, 3, 2, 1];

  // Filter brands by search input
  const filteredBrands = useMemo(() => {
    const allBrands = facets?.brands || [];
    if (!brandSearch.trim()) return allBrands;
    const q = brandSearch.toLowerCase();
    return allBrands.filter((b) => b.name?.toLowerCase().includes(q));
  }, [facets?.brands, brandSearch]);

  // Subcategories from facets
  const subcategories = facets?.subcategories || [];

  // Price range info from facets
  const priceRanges = facets?.priceRanges || [];
  const ratingCounts = facets?.ratings || {};

  return (
    <aside className="w-full lg:w-[240px] shrink-0 text-[13px] text-[#0F1111] space-y-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto no-scrollbar pb-4">
      {/* Active filters clear bar */}
      {hasActiveFilters && (
        <div className="pb-3 mb-1 border-b border-[#D5D9D9] flex items-center justify-between">
          <span className="font-semibold text-[13px] text-[#0F1111]">Active Filters</span>
          <button
            type="button"
            onClick={onClearAll}
            className="text-[12px] text-[#007185] hover:text-[#C7511F] hover:underline font-medium transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ─── Department ─── */}
      <FilterSection title="Department" defaultOpen={true} className={hasActiveFilters ? '' : 'border-t-0'}>
        <ul className="space-y-1.5 pl-1">
          <li>
            <button
              type="button"
              onClick={() => onCategorySelect('', '')}
              className={`hover:text-[#C7511F] hover:underline text-left transition-colors ${
                !selectedL1 ? 'font-semibold text-[#0F1111]' : 'text-[#007185]'
              }`}
            >
              All Departments
            </button>
          </li>
          {categories.map((cat) => {
            const isL1Selected = selectedL1 === cat.name;
            return (
              <li key={cat.name}>
                <button
                  type="button"
                  onClick={() => onCategorySelect(cat.name, '')}
                  className={`hover:text-[#C7511F] hover:underline text-left block w-full truncate transition-colors ${
                    isL1Selected ? 'font-semibold text-[#0F1111]' : 'text-[#007185]'
                  }`}
                >
                  {cat.name}
                </button>
                {/* L2 subcategories — use facet-based subcategories if L1 selected */}
                {isL1Selected && (
                  <ul className="pl-3 mt-1.5 space-y-1 border-l-2 border-[#E3E6E6]">
                    {(subcategories.length > 0 ? subcategories : cat.subcategories || []).map((sub) => {
                      const subName = sub.name || sub;
                      const subCount = sub.count;
                      const isL2Selected = selectedL2 === subName;
                      return (
                        <li key={subName}>
                          <button
                            type="button"
                            onClick={() => onCategorySelect(cat.name, subName)}
                            className={`hover:text-[#C7511F] hover:underline text-left block w-full text-[12px] transition-colors ${
                              isL2Selected ? 'font-semibold text-[#0F1111]' : 'text-[#565959]'
                            }`}
                          >
                            {subName}
                            {subCount !== undefined && (
                              <span className="ml-1 text-[11px] text-[#A6A6A6]">({subCount})</span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </FilterSection>

      {/* ─── Customer Reviews ─── */}
      <FilterSection title="Customer Reviews" defaultOpen={true}>
        <div className="space-y-2">
          {ratingOptions.map((stars) => {
            const isSelected = String(minRating) === String(stars);
            const countKey = `${stars}plus`;
            const count = ratingCounts[countKey];
            return (
              <button
                key={stars}
                type="button"
                onClick={() => onRatingChange(isSelected ? '' : String(stars))}
                className={`flex items-center gap-1.5 text-left w-full hover:text-[#C7511F] group transition-colors ${
                  isSelected ? 'font-semibold' : ''
                }`}
              >
                <Rating value={stars} size={14} />
                <span className="text-[12px] text-[#007185] group-hover:text-[#C7511F] group-hover:underline transition-colors">
                  & Up
                </span>
                {count !== undefined && (
                  <span className="text-[11px] text-[#A6A6A6] ml-auto">({count})</span>
                )}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* ─── Price Range ─── */}
      <FilterSection title="Price" defaultOpen={true}>
        <ul className="space-y-1 mb-3">
          {pricePresets.map((preset, idx) => {
            const isActive = minPrice === preset.min && maxPrice === preset.max;
            // Find matching facet count
            const matchBucket = priceRanges.find((b) => {
              if (preset.min === '' && preset.max === '25') return b._id === 0;
              if (preset.min === '25' && preset.max === '50') return b._id === 25;
              if (preset.min === '50' && preset.max === '100') return b._id === 50;
              if (preset.min === '100' && preset.max === '200') return b._id === 100;
              if (preset.min === '200' && preset.max === '500') return b._id === 200;
              return false;
            });
            return (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => {
                    if (isActive) {
                      setMinInput('');
                      setMaxInput('');
                      onPriceChange('', '');
                    } else {
                      setMinInput(preset.min);
                      setMaxInput(preset.max);
                      onPriceChange(preset.min, preset.max);
                    }
                  }}
                  className={`text-[13px] hover:text-[#C7511F] hover:underline transition-colors ${
                    isActive ? 'font-semibold text-[#0F1111]' : 'text-[#007185]'
                  }`}
                >
                  {preset.label}
                  {matchBucket && (
                    <span className="ml-1 text-[11px] text-[#A6A6A6]">({matchBucket.count})</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <form onSubmit={handlePriceSubmit} className="flex items-center gap-1.5">
          <div className="relative w-16">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#565959] text-[12px]">$</span>
            <input
              type="number"
              placeholder="Min"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              className="w-full h-[30px] pl-5 pr-1 text-[12px] border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600] transition-colors"
            />
          </div>
          <span className="text-[#565959] text-[12px]">–</span>
          <div className="relative w-16">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#565959] text-[12px]">$</span>
            <input
              type="number"
              placeholder="Max"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              className="w-full h-[30px] pl-5 pr-1 text-[12px] border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600] transition-colors"
            />
          </div>
          <button
            type="submit"
            className="h-[30px] px-2.5 bg-white border border-[#D5D9D9] hover:bg-[#F7FAFA] text-[12px] font-medium rounded-[3px] shadow-sm transition-colors active:bg-[#EDEDED]"
          >
            Go
          </button>
        </form>
      </FilterSection>

      {/* ─── Brand ─── */}
      {facets?.brands && facets.brands.length > 0 && (
        <FilterSection title="Brand" defaultOpen={true}>
          {/* Brand search box when many brands */}
          {facets.brands.length > 5 && (
            <div className="relative mb-2">
              <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#A6A6A6]" />
              <input
                type="text"
                placeholder="Search brands..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="w-full h-[28px] pl-7 pr-2 text-[12px] border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600] transition-colors"
              />
            </div>
          )}
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 no-scrollbar">
            {filteredBrands.map((b) => (
              <div key={b.name} className="flex items-center">
                <Checkbox
                  label={b.name}
                  checked={brand === b.name}
                  count={b.count}
                  onChange={(e) => onBrandChange(e.target.checked ? b.name : '')}
                />
              </div>
            ))}
            {filteredBrands.length === 0 && (
              <p className="text-[12px] text-[#A6A6A6] py-1">No brands match "{brandSearch}"</p>
            )}
          </div>
        </FilterSection>
      )}

      {/* ─── Deals & Discounts ─── */}
      <FilterSection title="Deals & Discounts" defaultOpen={Boolean(discount)}>
        <div className="space-y-1.5">
          {[
            { label: "Today's Deals", val: 'deals' },
            { label: '10% off or more', val: '10' },
            { label: '25% off or more', val: '25' },
            { label: '50% off or more', val: '50' },
          ].map((d) => {
            const isSelected = discount === d.val;
            return (
              <button
                key={d.val}
                type="button"
                onClick={() => onDiscountChange && onDiscountChange(isSelected ? '' : d.val)}
                className={`text-[13px] hover:text-[#C7511F] hover:underline transition-colors block text-left w-full ${
                  isSelected ? 'font-bold text-[#C7511F]' : 'text-[#007185]'
                }`}
              >
                {isSelected ? '✓ ' : ''}{d.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* ─── Availability ─── */}
      <FilterSection title="Availability" defaultOpen={true}>
        <Checkbox
          label="Include Out of Stock"
          checked={!inStockOnly}
          onChange={(e) => onInStockToggle(!e.target.checked)}
        />
      </FilterSection>

      {/* ─── Shipping ─── */}
      <FilterSection title="Eligible for Free Shipping" defaultOpen={false}>
        <Checkbox
          label="Free Shipping by ShopSphere"
          checked={false}
          onChange={() => {}}
        />
      </FilterSection>

      {/* ─── Seller ─── */}
      <FilterSection title="Seller" defaultOpen={false}>
        <div className="space-y-1.5">
          <Checkbox label="ShopSphere Direct" checked={false} onChange={() => {}} />
          <Checkbox label="Third-Party Sellers" checked={false} onChange={() => {}} />
        </div>
      </FilterSection>

      {/* ─── Condition ─── */}
      <FilterSection title="Condition" defaultOpen={false}>
        <div className="space-y-1.5">
          <Checkbox label="New" checked={false} onChange={() => {}} />
          <Checkbox label="Renewed" checked={false} onChange={() => {}} />
          <Checkbox label="Used" checked={false} onChange={() => {}} />
        </div>
      </FilterSection>
    </aside>
  );
}
