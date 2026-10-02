import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Layers } from 'lucide-react';
import { useGetCategoriesQuery } from '../../store/productsApi';

/**
 * CategoryBrowse — Departments & Category Directory
 * Amazon-styled, dense, functional card grid.
 */
export default function CategoryBrowse() {
  const { data, isLoading, error } = useGetCategoriesQuery();
  const categories = data?.data || [];

  return (
    <div className="w-full bg-[#EAEDED] min-h-[calc(100vh-100px)] py-6">
      <div className="page-container">
        <div className="mb-6">
          <h1 className="text-[24px] font-semibold text-[#0F1111]">
            Shop By Department
          </h1>
          <p className="text-[13px] text-[#565959] mt-0.5">
            Explore products organized by department and category
          </p>
        </div>

        {isLoading && (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-[#007185] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[13px] text-[#565959]">Loading departments...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-[3px] bg-[#FFF0F0] border-l-4 border-l-[#B12704] border border-[#D5D9D9] text-[#B12704] text-[13px] text-center mb-6">
            Failed to load categories. Please try again.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((category) => (
            <div
              key={category.name}
              className="bg-white border border-[#D5D9D9] rounded-[2px] p-5 flex flex-col justify-between hover:shadow-sm transition-shadow"
            >
              <div>
                <div className="flex items-center gap-2.5 mb-3 border-b border-[#F0F2F2] pb-3">
                  <div className="w-9 h-9 rounded-[2px] bg-[#F0F2F2] border border-[#D5D9D9] text-[#232F3E] flex items-center justify-center shrink-0">
                    <Layers size={20} strokeWidth={1.75} />
                  </div>
                  <h2 className="text-[18px] font-semibold text-[#0F1111]">
                    {category.name}
                  </h2>
                </div>

                {category.subcategories?.length > 0 ? (
                  <ul className="space-y-2 mb-6">
                    {category.subcategories.slice(0, 6).map((sub) => {
                      const subName = typeof sub === 'string' ? sub : sub.name;
                      return (
                        <li key={subName}>
                          <Link
                            to={`/products?categoryL1=${encodeURIComponent(
                              category.name
                            )}&categoryL2=${encodeURIComponent(subName)}`}
                            className="text-[13px] text-[#0F1111] hover:text-[#C7511F] hover:underline flex items-center justify-between group"
                          >
                            <span>{subName}</span>
                            <ChevronRight
                              size={14}
                              strokeWidth={2}
                              className="text-[#767676] group-hover:text-[#C7511F]"
                            />
                          </Link>
                        </li>
                      );
                    })}
                    {category.subcategories.length > 6 && (
                      <li className="text-[12px] text-[#565959] pt-1">
                        +{category.subcategories.length - 6} more subcategories
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-[13px] text-[#767676] mb-6">
                    Browse all products in this department
                  </p>
                )}
              </div>

              <Link
                to={`/products?categoryL1=${encodeURIComponent(category.name)}`}
                className="w-full py-2 px-3 text-center bg-[#F0F2F2] hover:bg-[#E3E6E6] text-[#0F1111] text-[13px] font-medium rounded-[3px] border border-[#D5D9D9] transition-colors block"
              >
                See all in {category.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
