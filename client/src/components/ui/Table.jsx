import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

/**
 * Table component adhering to Design Brief Section 12 & 13:
 * - Sticky header
 * - 13px text
 * - Row hover #F7FAFA
 * - Sortable columns
 */
export default function Table({
  columns = [],
  data = [],
  sortColumn,
  sortDirection = 'asc',
  onSort,
  keyField = 'id',
  isLoading = false,
  emptyMessage = 'No records found',
  className = '',
}) {
  return (
    <div className={`w-full overflow-x-auto border border-[#D5D9D9] rounded-[4px] bg-white ${className}`}>
      <table className="w-full text-left border-collapse text-[13px]">
        <thead className="bg-[#F0F2F2] border-b border-[#D5D9D9] sticky top-0 z-10">
          <tr>
            {columns.map((col) => {
              const isSorted = sortColumn === col.key;
              return (
                <th
                  key={col.key}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  className={`px-3.5 py-2.5 font-medium text-[#0F1111] whitespace-nowrap ${
                    col.sortable ? 'cursor-pointer hover:bg-[#E3E6E6] select-none' : ''
                  } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                  style={{ width: col.width }}
                >
                  <div className={`inline-flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="text-[#565959]">
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp size={13} strokeWidth={2} />
                          ) : (
                            <ArrowDown size={13} strokeWidth={2} />
                          )
                        ) : (
                          <ArrowUpDown size={13} strokeWidth={1.5} className="opacity-40" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D5D9D9]">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center text-[#565959]">
                <div className="flex justify-center items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-[#E77600] border-t-transparent animate-spin" />
                  <span>Loading data...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center text-[#565959]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={row[keyField] ?? idx}
                className="hover:bg-[#F7FAFA] transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3.5 py-2 text-[#0F1111] align-middle ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {col.render ? col.render(row[col.key], row, idx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
