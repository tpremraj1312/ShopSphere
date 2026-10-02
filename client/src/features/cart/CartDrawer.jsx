import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
} from '../../store/cartApi';
import Price from '../../components/ui/Price';
import Button from '../../components/ui/Button';
import { X, Trash2 } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose }) {
  const { data, isLoading } = useGetCartQuery();
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeCartItem] = useRemoveCartItemMutation();
  const navigate = useNavigate();

  const cart = data?.data;
  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white border-l border-[#D5D9D9] shadow-xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 bg-[#232F3E] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-semibold text-white">Your Shopping Cart</h2>
              <span className="px-2 py-0.5 rounded-[2px] bg-[#E77600] text-white text-[12px] font-bold">
                {items.length}
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close cart drawer"
              className="text-white/80 hover:text-white p-1 rounded-[2px]"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {isLoading ? (
              <div className="py-12 text-center text-[#565959] text-[13px]">
                Loading cart...
              </div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center text-[#565959]">
                <p className="text-[14px] font-medium text-[#0F1111] mb-1">Your cart is empty</p>
                <p className="text-[12px] mb-4">Discover products from our wide marketplace</p>
                <Link to="/products" onClick={onClose}>
                  <Button variant="primary" size="compact">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              items.map((item) => {
                const product = item.productId || {};
                const title = product.title || product.name || 'ShopSphere Product';
                const imageSrc =
                  item.image ||
                  product.images?.[0]?.url ||
                  product.images?.[0] ||
                  product.image ||
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80';
                const price = item.price ?? product.basePrice ?? 0;

                return (
                  <div
                    key={item._id || item.id}
                    className="flex gap-3 p-2.5 bg-[#F7FAFA] border border-[#D5D9D9] rounded-[3px]"
                  >
                    <img
                      src={imageSrc}
                      alt={title}
                      className="w-14 h-14 object-contain bg-white border border-[#D5D9D9] rounded-[2px] p-1 shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <Link
                          to={`/products/${product._id || product.id}`}
                          onClick={onClose}
                          className="font-medium text-[#0F1111] text-[13px] hover:text-[#C7511F] line-clamp-1 block"
                        >
                          {title}
                        </Link>
                        <div className="text-[12px] text-[#007600]">In Stock</div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <Price amount={price * (item.qty || 1)} size="sm" />
                        <button
                          onClick={() => removeCartItem(item._id)}
                          className="text-[#B12704] hover:text-[#900] text-[12px] p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 size={13} strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Subtotal & Checkout */}
          {items.length > 0 && (
            <div className="p-4 border-t border-[#D5D9D9] bg-white space-y-3">
              <div className="flex items-baseline justify-between text-[14px]">
                <span className="text-[#565959]">Subtotal:</span>
                <Price amount={subtotal} size="md" />
              </div>

              <Button
                variant="primary"
                size="form"
                fullWidth
                onClick={() => {
                  onClose();
                  navigate('/cart');
                }}
              >
                Go to Cart ({items.length} items)
              </Button>

              <Button
                variant="buy"
                size="form"
                fullWidth
                onClick={() => {
                  onClose();
                  navigate('/checkout');
                }}
              >
                Proceed to Checkout
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
