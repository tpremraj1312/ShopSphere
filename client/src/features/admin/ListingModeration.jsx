import React, { useState } from 'react';
import { useGetAdminProductsQuery, useModerateProductMutation } from '../../store/adminApi';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Price from '../../components/ui/Price';
import Pagination from '../../components/ui/Pagination';
import { Search, Tag, AlertTriangle } from 'lucide-react';

export default function ListingModeration() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState(null);

  // Moderation modal state
  const [moderatingProduct, setModeratingProduct] = useState(null);
  const [targetStatus, setTargetStatus] = useState('unpublished');
  const [reason, setReason] = useState('');

  const { data, isLoading, refetch } = useGetAdminProductsQuery({
    page,
    limit: 12,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const [moderateProduct, { isLoading: isUpdating }] = useModerateProductMutation();

  const products = data?.data?.products || [];
  const pagination = data?.data?.pagination || { totalPages: 1, totalItems: products.length };

  const handleOpenModeration = (product, newStatus) => {
    setModeratingProduct(product);
    setTargetStatus(newStatus);
    setReason('');
  };

  const handleExecuteModeration = async (e) => {
    e.preventDefault();
    if (!moderatingProduct) return;

    try {
      await moderateProduct({
        id: moderatingProduct._id,
        status: targetStatus,
        reason: reason || `Admin updated listing status to ${targetStatus}`,
      }).unwrap();

      setFeedback({
        type: 'success',
        message: `Product "${moderatingProduct.title}" has been updated to ${targetStatus}.`,
      });
      setModeratingProduct(null);
      refetch();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.data?.error?.message || err?.message || 'Moderation action failed.',
      });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[24px] font-normal text-[#0F1111]">
          Listing Moderation
        </h1>
        <p className="text-[13px] text-[#565959] mt-0.5">
          Review, approve, or delist vendor items across the ShopSphere catalog.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-[3px] text-[13px] border ${
            feedback.type === 'success'
              ? 'bg-[#F0F8F0] border-[#007600]/30 text-[#007600]'
              : 'bg-[#FFF0F0] border-[#B12704]/30 text-[#B12704]'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Search listings by title, SKU, or seller"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-[32px] pl-3 pr-8 text-[13px] border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#E77600]"
          />
          <Search size={15} strokeWidth={2} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#565959]" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-[32px] px-2.5 text-[12px] bg-[#F0F2F2] border border-[#D5D9D9] rounded-[3px] text-[#0F1111] cursor-pointer"
        >
          <option value="">All Listing Statuses</option>
          <option value="active">Active (Published)</option>
          <option value="unpublished">Unpublished</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      {/* Listings Table */}
      <div className="bg-white border border-[#D5D9D9] rounded-[4px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#F0F2F2] border-b border-[#D5D9D9] sticky top-0">
              <tr>
                <th className="px-3.5 py-2.5 font-medium text-[#0F1111]">Product</th>
                <th className="px-3.5 py-2.5 font-medium text-[#0F1111]">Seller</th>
                <th className="px-3.5 py-2.5 font-medium text-[#0F1111]">Base Price</th>
                <th className="px-3.5 py-2.5 font-medium text-[#0F1111]">Status</th>
                <th className="px-3.5 py-2.5 font-medium text-[#0F1111] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5D9D9]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#565959]">
                    Loading listings...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#565959]">
                    No listings found matching filter.
                  </td>
                </tr>
              ) : (
                products.map((item) => {
                  const imageSrc =
                    item.variants?.[0]?.images?.[0] ||
                    item.image ||
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80';
                  const isPublished = item.status === 'active';

                  return (
                    <tr key={item._id} className="hover:bg-[#F7FAFA] transition-colors">
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={imageSrc}
                            alt={item.title}
                            className="w-10 h-10 object-contain bg-[#F0F2F2] border border-[#D5D9D9] rounded-[2px] p-0.5 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-[#0F1111] truncate max-w-md">{item.title}</div>
                            <div className="text-[11px] text-[#565959]">{item.category?.l1 || 'Catalog Item'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-[12px] text-[#0F1111]">
                        {item.sellerId?.businessName || item.sellerId?.email || 'Direct Seller'}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <Price amount={item.basePrice || item.variants?.[0]?.price || 0} size="sm" />
                      </td>
                      <td className="px-3.5 py-2.5">
                        <Badge variant={isPublished ? 'inStock' : 'neutral'} size="sm">
                          {item.status || 'Draft'}
                        </Badge>
                      </td>
                      <td className="px-3.5 py-2.5 text-right space-x-2">
                        {isPublished ? (
                          <Button
                            variant="danger"
                            size="compact"
                            onClick={() => handleOpenModeration(item, 'unpublished')}
                          >
                            Unpublish
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="compact"
                            onClick={() => handleOpenModeration(item, 'active')}
                          >
                            Publish
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages || 1}
          totalItems={pagination.totalItems}
          onPageChange={setPage}
        />
      </div>

      {/* Moderation Reason Modal */}
      <Modal
        isOpen={Boolean(moderatingProduct)}
        onClose={() => setModeratingProduct(null)}
        title={`Change Listing Status to "${targetStatus}"`}
      >
        <form onSubmit={handleExecuteModeration} className="space-y-4">
          <p className="text-[13px] text-[#565959]">
            Target product: <strong className="text-[#0F1111]">{moderatingProduct?.title}</strong>
          </p>

          <div>
            <label className="block text-[13px] font-medium text-[#0F1111] mb-1">
              Moderation Reason:
            </label>
            <textarea
              rows={3}
              required
              placeholder="State reason for policy enforcement or compliance record"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 text-[13px] border border-[#A6A6A6] rounded-[3px] focus:outline-none focus:border-[#E77600]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="compact"
              type="button"
              onClick={() => setModeratingProduct(null)}
            >
              Cancel
            </Button>
            <Button
              variant={targetStatus === 'unpublished' ? 'danger' : 'primary'}
              size="compact"
              type="submit"
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Apply Status'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
