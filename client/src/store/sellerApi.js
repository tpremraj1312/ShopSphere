import { api } from './api';

export const sellerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Seller Application / Onboarding (SELL-FR-01, Step 3.1.3)
    applySeller: builder.mutation({
      query: (data) => ({
        url: '/sellers/apply',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    requestSellerPhoneOtp: builder.mutation({
      query: (data) => ({ url: '/sellers/phone-otp', method: 'POST', body: data }),
    }),

    verifySellerPhoneOtp: builder.mutation({
      query: (data) => ({ url: '/sellers/phone-otp/verify', method: 'POST', body: data }),
    }),

    // Inventory Management (SELL-FR-03, Step 3.1.1)
    getInventory: builder.query({
      query: (params = {}) => ({
        url: '/seller/inventory',
        params,
      }),
      providesTags: ['Inventory'],
    }),

    updateSkuStock: builder.mutation({
      query: (data) => ({
        url: '/seller/inventory/stock',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Inventory', 'Product'],
    }),

    // Sales Analytics (SELL-FR-04, Step 3.1.2)
    getSellerAnalytics: builder.query({
      query: (params = {}) => ({
        url: '/seller/analytics',
        params,
      }),
      providesTags: ['SellerAnalytics'],
    }),

    // CSV Bulk Upload (SELL-FR-05, Step 3.1.4)
    bulkUploadProducts: builder.mutation({
      query: (data) => ({
        url: '/seller/products/bulk-csv',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Inventory', 'Product'],
    }),
  }),
});

export const {
  useApplySellerMutation,
  useRequestSellerPhoneOtpMutation,
  useVerifySellerPhoneOtpMutation,
  useGetInventoryQuery,
  useUpdateSkuStockMutation,
  useGetSellerAnalyticsQuery,
  useBulkUploadProductsMutation,
} = sellerApi;
