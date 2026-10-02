import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, ArrowRight, Star, X, Tag } from 'lucide-react';
import { useGetSuggestionsQuery } from '../store/productsApi';

export default function SearchSuggestions({
  isOpen,
  query,
  category,
  onSelectQuery,
  onClose,
  inputRef,
}) {
  const navigate = useNavigate();
  const [recentSearches, setRecentSearches] = useState([]);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce query to 180ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 180);
    return () => clearTimeout(handler);
  }, [query]);

  // Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem('shopsphere_recent_searches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (e) {
      // ignore
    }
  }, [isOpen]);

  const { data: suggestionsData, isFetching } = useGetSuggestionsQuery(
    { q: debouncedQuery, categoryL1: category },
    { skip: !debouncedQuery || debouncedQuery.length < 1 }
  );

  if (!isOpen) return null;

  const suggestions = suggestionsData?.data?.suggestions || [];
  const products = suggestionsData?.data?.products || [];
  const hasResults = suggestions.length > 0 || products.length > 0;

  const handleClearRecents = (e) => {
    e.stopPropagation();
    localStorage.removeItem('shopsphere_recent_searches');
    setRecentSearches([]);
  };

  const handleRemoveRecent = (e, item) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== item);
    localStorage.setItem('shopsphere_recent_searches', JSON.stringify(updated));
    setRecentSearches(updated);
  };

  const saveRecentSearch = (term) => {
    if (!term || !term.trim()) return;
    try {
      const stored = localStorage.getItem('shopsphere_recent_searches');
      const list = stored ? JSON.parse(stored) : [];
      const updated = [term.trim(), ...list.filter((s) => s.toLowerCase() !== term.trim().toLowerCase())].slice(0, 8);
      localStorage.setItem('shopsphere_recent_searches', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  return (
    <div
      id="search-suggestions-dropdown"
      className="absolute top-full left-0 right-0 mt-1 bg-white text-[#0F1111] rounded-[4px] shadow-2xl border border-[#D5D9D9] z-50 overflow-hidden divide-y divide-[#E3E6E6] animate-in fade-in duration-100"
    >
      {/* ─── State 1: Active Query with Suggestions / Products ─── */}
      {debouncedQuery.length > 0 ? (
        <div>
          {/* Department search shortcut banner */}
          <button
            type="button"
            onMouseDown={() => {
              saveRecentSearch(debouncedQuery);
              onSelectQuery(debouncedQuery, category);
            }}
            className="w-full px-4 py-2.5 bg-[#F7FAFA] hover:bg-[#EDFDFF] flex items-center justify-between text-left text-[13px] border-b border-[#E3E6E6] transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search size={15} className="text-[#007185] group-hover:text-[#C7511F]" />
              <span>
                Search for <strong className="text-[#0F1111]">"{debouncedQuery}"</strong>
                {category && (
                  <span className="text-[#565959] ml-1">in {category}</span>
                )}
              </span>
            </div>
            <ArrowRight size={14} className="text-[#565959] group-hover:text-[#C7511F] group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#E3E6E6]">
            {/* Left: Term Suggestions (5 cols) */}
            <div className="md:col-span-5 p-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#565959] px-2 py-1">
                Suggested Searches
              </div>
              {suggestions.length > 0 ? (
                <ul className="space-y-0.5">
                  {suggestions.map((term, idx) => (
                    <li key={idx}>
                      <button
                        type="button"
                        onMouseDown={() => {
                          saveRecentSearch(term);
                          onSelectQuery(term, category);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-[3px] text-left text-[13px] text-[#0F1111] hover:bg-[#F0F2F2] flex items-center gap-2 transition-colors cursor-pointer group"
                      >
                        <Search size={13} className="text-[#A6A6A6] group-hover:text-[#0F1111]" />
                        <span className="truncate">{term}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-2.5 py-3 text-[12px] text-[#565959]">
                  {isFetching ? 'Searching catalogue...' : `Press Enter to search for "${debouncedQuery}"`}
                </div>
              )}
            </div>

            {/* Right: Preview Products (7 cols) */}
            <div className="md:col-span-7 p-2 bg-[#FAFAFA]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#565959] px-2 py-1 flex items-center justify-between">
                <span>Matching Products</span>
                {products.length > 0 && (
                  <span className="text-[10px] text-[#007185] font-normal">Instant Preview</span>
                )}
              </div>

              {products.length > 0 ? (
                <div className="space-y-1 mt-1">
                  {products.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={() => {
                        saveRecentSearch(item.title);
                        onClose();
                        navigate(`/products/${item.id}`);
                      }}
                      className="w-full p-2 bg-white hover:bg-[#EDFDFF] border border-transparent hover:border-[#007185]/30 rounded-[4px] flex items-center gap-3 text-left transition-colors cursor-pointer group shadow-xs"
                    >
                      <div className="w-12 h-12 bg-white rounded-[3px] border border-[#E3E6E6] shrink-0 p-1 flex items-center justify-center overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="max-h-full max-w-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-[#0F1111] group-hover:text-[#C7511F] font-medium line-clamp-1">
                          {item.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                          <span className="text-[#007600] font-bold">${item.price?.toFixed(2)}</span>
                          {item.brand && (
                            <span className="text-[#565959] border-l border-[#D5D9D9] pl-2">{item.brand}</span>
                          )}
                          {item.rating > 0 && (
                            <span className="flex items-center text-[#E77600] border-l border-[#D5D9D9] pl-2">
                              ★ {item.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-[12px] text-[#565959]">
                  {isFetching ? 'Loading matching products...' : 'No direct product matches. Hit enter to see all results.'}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ─── State 2: No query typed yet (Show Recent Searches + Popular) ─── */
        <div className="p-3">
          {recentSearches.length > 0 ? (
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#565959] px-2 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Clock size={12} /> Recent Searches
                </span>
                <button
                  type="button"
                  onMouseDown={handleClearRecents}
                  className="text-[11px] text-[#007185] hover:text-[#C7511F] hover:underline normal-case font-normal"
                >
                  Clear history
                </button>
              </div>
              <ul className="space-y-0.5">
                {recentSearches.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between hover:bg-[#F0F2F2] rounded-[3px] group px-2 py-1">
                    <button
                      type="button"
                      onMouseDown={() => onSelectQuery(item, '')}
                      className="flex-1 flex items-center gap-2 text-[13px] text-[#0F1111] group-hover:text-[#C7511F] text-left cursor-pointer"
                    >
                      <Clock size={13} className="text-[#A6A6A6]" />
                      <span>{item}</span>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => handleRemoveRecent(e, item)}
                      className="text-[#A6A6A6] hover:text-[#0F1111] p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove search item"
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="py-2 px-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#565959] mb-2 flex items-center gap-1.5">
                <Tag size={12} /> Popular Departments
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Electronics', 'Computers & Office', 'Home & Kitchen', 'Audio & Headphones', 'Sports & Outdoors'].map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onMouseDown={() => onSelectQuery('', dept)}
                    className="px-2.5 py-1 bg-[#F0F2F2] hover:bg-[#E3E6E6] text-[12px] text-[#0F1111] rounded-full transition-colors cursor-pointer"
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
