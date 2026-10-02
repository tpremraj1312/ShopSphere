import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectCompareItems,
  selectCompareCount,
  removeFromCompare,
  clearCompare,
} from '../store/compareSlice';
import Button from './ui/Button';
import Price from './ui/Price';
import { X, ArrowRight, Layers, Trash2 } from 'lucide-react';

export default function CompareBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const items = useSelector(selectCompareItems);
  const count = useSelector(selectCompareCount);

  // Do not show on the actual compare page or in seller/admin portals
  if (count === 0 || location.pathname === '/compare' || location.pathname.startsWith('/seller') || location.pathname.startsWith('/admin')) {
    return null;
  }

  const slots = [0, 1, 2, 3];

  return (
    <aside aria-label="Compare products tray" className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-[#E77600] shadow-[0_-4px_20px_rgba(0,0,0,0.15)] transition-transform duration-300">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Info & Thumbnails */}
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-[#E77600]/10 text-[#E77600] flex items-center justify-center font-bold">
              <Layers size={17} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#0F1111] leading-tight">
                Compare Products ({count}/4)
              </p>
              <p className="text-[11px] text-[#565959]">
                Side-by-side specs &amp; AI consultation
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-[#D5D9D9] hidden sm:block shrink-0" />

          {/* Product Thumbnails Slots */}
          <div className="flex items-center gap-2 shrink-0">
            {slots.map((idx) => {
              const item = items[idx];
              if (item) {
                const id = item._id || item.id;
                const title = item.title || item.name || 'Product';
                const image =
                  item.variants?.[0]?.images?.[0]?.url ||
                  item.variants?.[0]?.images?.[0] ||
                  item.images?.[0]?.url ||
                  item.images?.[0] ||
                  item.image ||
                  '/placeholder-product.svg';
                const price =
                  item.basePrice ?? item.price ?? item.variants?.[0]?.price ?? 0;

                return (
                  <div
                    key={id}
                    className="relative group w-14 sm:w-16 h-14 sm:h-16 bg-[#F7F7F7] border border-[#D5D9D9] rounded-[4px] p-1 flex flex-col items-center justify-center"
                    title={title}
                  >
                    <img
                      src={image}
                      alt={title}
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => dispatch(removeFromCompare(id))}
                      className="absolute -top-1.5 -right-1.5 bg-[#C40000] text-white rounded-full p-0.5 shadow hover:scale-110 transition-transform"
                      title="Remove"
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={`empty-${idx}`}
                  className="w-14 sm:w-16 h-14 sm:h-16 border border-dashed border-[#D5D9D9] rounded-[4px] flex items-center justify-center text-[10px] text-[#888C8C] text-center p-1 bg-[#FAFAFA]"
                >
                  + Add
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-2.5 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={() => dispatch(clearCompare())}
            className="flex items-center gap-1 text-[12px] text-[#565959] hover:text-[#C40000] px-2 py-1 transition-colors"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>

          <Button
            variant="primary"
            size="compact"
            onClick={() => navigate('/compare')}
            className="flex items-center gap-2 !px-5 !py-2 text-[13px] font-medium shadow-sm"
          >
            <span>Compare Now ({count})</span>
            <ArrowRight size={15} />
          </Button>
        </div>
      </div>
    </aside>
  );
}
