import { api } from './api';

export const reviewApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // List reviews for a product (public)
    getProductReviews: builder.query({
      query: ({ productId, page = 1, limit = 10, sort = 'newest' }) => ({
        url: '/reviews',
        params: { productId, page, limit, sort },
      }),
      providesTags: (result, error, arg) => [
        { type: 'Review', id: `LIST-${arg.productId}` },
      ],
    }),

    // Create a review (REV-FR-01)
    createReview: builder.mutation({
      query: (data) => ({
        url: '/reviews',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result) => [
        { type: 'Review', id: `LIST-${result?.data?.productId}` },
        'Product',
      ],
    }),

    // Update own review
    updateReview: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/reviews/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result) => [
        { type: 'Review', id: `LIST-${result?.data?.productId}` },
        'Product',
      ],
    }),

    // Delete own review
    deleteReview: builder.mutation({
      query: (id) => ({
        url: `/reviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Review', 'Product'],
    }),

    // Vote helpful/unhelpful (REV-FR-04)
    voteReview: builder.mutation({
      query: ({ id, vote }) => ({
        url: `/reviews/${id}/vote`,
        method: 'POST',
        body: { vote },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Review', id: `LIST-${arg.productId}` },
      ],
    }),

    // Seller respond to review (REV-FR-05)
    respondToReview: builder.mutation({
      query: ({ id, body }) => ({
        url: `/reviews/${id}/response`,
        method: 'POST',
        body: { body },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Review', id: `LIST-${arg.productId}` },
      ],
    }),
  }),
});

export const {
  useGetProductReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useVoteReviewMutation,
  useRespondToReviewMutation,
} = reviewApi;
