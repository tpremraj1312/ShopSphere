import { api } from './api';

export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params) => ({
        url: '/products',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Products', id: _id })),
              { type: 'Products', id: 'LIST' },
            ]
          : [{ type: 'Products', id: 'LIST' }],
    }),
    getProductById: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Products', id }],
    }),
    getCategories: builder.query({
      query: () => '/products/categories',
      providesTags: ['Categories'],
    }),
    getSellerProducts: builder.query({
      query: (params) => ({
        url: '/products/seller/mine',
        params,
      }),
      providesTags: ['SellerProducts'],
    }),
    createProduct: builder.mutation({
      query: (data) => ({
        url: '/products',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }, 'SellerProducts', 'Categories'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Products', id },
        { type: 'Products', id: 'LIST' },
        'SellerProducts',
        'Categories',
      ],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }, 'SellerProducts', 'Categories'],
    }),
    getUploadUrl: builder.mutation({
      query: (data) => ({
        url: '/products/upload-url',
        method: 'POST',
        body: data,
      }),
    }),
    getFacets: builder.query({
      query: (params) => ({
        url: '/products/facets',
        params,
      }),
    }),
    getAlsoBought: builder.query({
      query: ({ id, limit = 4 }) => ({
        url: `/products/${id}/also-bought`,
        params: { limit },
      }),
      providesTags: (result, error, { id }) => [{ type: 'Products', id: `ALSO-${id}` }],
    }),
    getSuggestions: builder.query({
      query: ({ q, categoryL1 }) => ({
        url: '/products/suggestions',
        params: { q, ...(categoryL1 && { categoryL1 }) },
      }),
    }),
    compareWithAi: builder.mutation({
      query: (data) => ({
        url: '/products/compare/ai',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetCategoriesQuery,
  useGetSellerProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetUploadUrlMutation,
  useGetFacetsQuery,
  useGetAlsoBoughtQuery,
  useGetSuggestionsQuery,
  useCompareWithAiMutation,
} = productsApi;

