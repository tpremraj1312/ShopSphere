import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination component for marketplace search results and admin tables.
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  hasNextPage,
  hasPrevPage,
  totalItems,
  pageSize = 24,
}) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  return (
    <div className="flex items-center justify-between border-t border-[#D5D9D9] py-3 px-2 text-[13px] text-[#0F1111]">
      <div className="text-[#565959]">
        {totalItems ? (
          <span>
            Showing <strong className="font-semibold text-[#0F1111]">{startItem}-{endItem}</strong> of{' '}
            <strong className="font-semibold text-[#0F1111]">{totalItems}</strong> results
          </span>
        ) : (
          <span>Page {currentPage} of {totalPages}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={hasPrevPage !== undefined ? !hasPrevPage : currentPage <= 1}
          onClick={() => onPageChange?.(currentPage - 1)}
          className="inline-flex items-center gap-1 h-[32px] px-3 bg-white border border-[#D5D9D9] hover:bg-[#F7FAFA] rounded-[4px] text-[13px] font-medium text-[#0F1111] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} strokeWidth={1.75} />
          Previous
        </button>

        {totalPages > 1 && (
          <div className="hidden sm:flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange?.(pageNum)}
                  className={`h-[32px] w-[32px] flex items-center justify-center rounded-[4px] text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'border border-[#FFD814] bg-[#F7CA00]/20 font-semibold text-[#0F1111]'
                      : 'border border-transparent hover:border-[#D5D9D9] text-[#007185] hover:underline'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          disabled={hasNextPage !== undefined ? !hasNextPage : currentPage >= totalPages}
          onClick={() => onPageChange?.(currentPage + 1)}
          className="inline-flex items-center gap-1 h-[32px] px-3 bg-white border border-[#D5D9D9] hover:bg-[#F7FAFA] rounded-[4px] text-[13px] font-medium text-[#0F1111] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight size={16} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
