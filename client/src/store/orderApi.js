import { api } from './api';

export const orderApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Customer Orders & Checkout
    createCheckoutOrder: builder.mutation({
      query: (data) => ({
        url: '/checkout',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Cart', 'Order'],
    }),

    getMyOrders: builder.query({
      query: (params = {}) => ({
        url: '/orders',
        params,
      }),
      providesTags: ['Order'],
    }),

    getOrderById: builder.query({
      query: (orderId) => `/orders/${orderId}`,
      providesTags: (result, error, orderId) => [{ type: 'Order', id: orderId }],
    }),

    cancelOrder: builder.mutation({
      query: ({ orderId, reason }) => ({
        url: `/orders/${orderId}/cancel`,
        method: 'PUT',
        body: { reason },
      }),
      invalidatesTags: (result, error, { orderId }) => [{ type: 'Order', id: orderId }, 'Order'],
    }),

    // Seller Orders
    getSellerOrders: builder.query({
      query: (params = {}) => ({
        url: '/seller/orders',
        params,
      }),
      providesTags: ['SellerOrder'],
    }),

    updateSubOrderStatus: builder.mutation({
      query: ({ orderId, subOrderId, ...data }) => ({
        url: `/seller/orders/${orderId}/sub/${subOrderId}/status`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['SellerOrder', 'Order'],
    }),

    // Address Management
    getAddresses: builder.query({
      query: () => '/users/addresses',
      providesTags: ['Address'],
    }),

    addAddress: builder.mutation({
      query: (data) => ({
        url: '/users/addresses',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Address'],
    }),

    updateAddress: builder.mutation({
      query: ({ addressId, ...data }) => ({
        url: `/users/addresses/${addressId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Address'],
    }),

    deleteAddress: builder.mutation({
      query: (addressId) => ({
        url: `/users/addresses/${addressId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Address'],
    }),

    setDefaultAddress: builder.mutation({
      query: (addressId) => ({
        url: `/users/addresses/${addressId}/default`,
        method: 'PUT',
      }),
      invalidatesTags: ['Address'],
    }),

    // Payments
    createPaymentIntent: builder.mutation({
      query: (orderId) => ({
        url: '/payments/create-intent',
        method: 'POST',
        body: { orderId },
      }),
    }),

    // Sends Razorpay's success response to the backend for signature verification.
    // Body: { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
    verifyPayment: builder.mutation({
      query: (body) => ({
        url: '/payments/verify',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'PaymentStatus', id: orderId },
        { type: 'Order', id: orderId },
      ],
    }),

    getPaymentStatus: builder.query({
      query: (orderId) => `/payments/${orderId}/status`,
      providesTags: (result, error, orderId) => [{ type: 'PaymentStatus', id: orderId }],
    }),

    confirmCodOrder: builder.mutation({
      query: (orderId) => ({
        url: `/orders/${orderId}/confirm-cod`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, orderId) => [
        { type: 'Order', id: orderId },
        { type: 'PaymentStatus', id: orderId },
        'Order',
        'Cart',
      ],
    }),

    updateOrderAddress: builder.mutation({
      query: ({ orderId, ...data }) => ({
        url: `/orders/${orderId}/shipping-address`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        'Order',
      ],
    }),
  }),
});

export const {
  useCreateCheckoutOrderMutation,
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useCancelOrderMutation,
  useGetSellerOrdersQuery,
  useUpdateSubOrderStatusMutation,
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  useCreatePaymentIntentMutation,
  useVerifyPaymentMutation,
  useGetPaymentStatusQuery,
  useConfirmCodOrderMutation,
  useUpdateOrderAddressMutation,
} = orderApi;