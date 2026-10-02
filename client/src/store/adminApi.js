import { api } from './api';

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Step-up Re-authentication (ADM-FR-05, SEC-06)
    verifyStepUp: builder.mutation({
      query: (data) => ({
        url: '/admin/step-up',
        method: 'POST',
        body: data,
      }),
    }),

    // Platform Metrics (ADM-FR-03)
    getPlatformMetrics: builder.query({
      query: () => '/admin/metrics',
      providesTags: ['AdminMetrics'],
    }),

    // User Moderation (ADM-FR-01)
    getUsers: builder.query({
      query: (params = {}) => ({
        url: '/admin/users',
        params,
      }),
      providesTags: ['AdminUsers'],
    }),

    suspendUser: builder.mutation({
      query: ({ id, reason, stepUpToken }) => ({
        url: `/admin/users/${id}/suspend`,
        method: 'POST',
        body: { reason },
        headers: stepUpToken ? { 'x-step-up-token': stepUpToken } : {},
      }),
      invalidatesTags: ['AdminUsers', 'AdminMetrics', 'AuditLogs'],
    }),

    reinstateUser: builder.mutation({
      query: ({ id, reason, stepUpToken }) => ({
        url: `/admin/users/${id}/reinstate`,
        method: 'POST',
        body: { reason },
        headers: stepUpToken ? { 'x-step-up-token': stepUpToken } : {},
      }),
      invalidatesTags: ['AdminUsers', 'AdminMetrics', 'AuditLogs'],
    }),

    // Listing Moderation (ADM-FR-02)
    getAdminProducts: builder.query({
      query: (params = {}) => ({
        url: '/admin/products',
        params,
      }),
      providesTags: ['AdminProducts'],
    }),

    moderateProduct: builder.mutation({
      query: ({ id, status, reason }) => ({
        url: `/admin/products/${id}/moderate`,
        method: 'PATCH',
        body: { status, reason },
      }),
      invalidatesTags: ['AdminProducts', 'AdminMetrics', 'AuditLogs'],
    }),

    // Forced Refund (2.6.4, ADM-FR-05, SEC-21)
    forceRefund: builder.mutation({
      query: ({ id, reason, subOrderId, stepUpToken }) => ({
        url: `/admin/orders/${id}/refund`,
        method: 'POST',
        body: { reason, subOrderId },
        headers: stepUpToken ? { 'x-step-up-token': stepUpToken } : {},
      }),
      invalidatesTags: ['AdminMetrics', 'AuditLogs'],
    }),

    // Audit Log Viewer (ADM-FR-04, SEC-21)
    getAuditLogs: builder.query({
      query: (params = {}) => ({
        url: '/admin/audit-logs',
        params,
      }),
      providesTags: ['AuditLogs'],
    }),

    // 2FA Management (AUTH-FR-06, Step 4.1.6)
    get2FAStatus: builder.query({
      query: () => '/auth/2fa/status',
      providesTags: ['2FA'],
    }),

    setup2FA: builder.mutation({
      query: () => ({
        url: '/auth/2fa/setup',
        method: 'POST',
      }),
    }),

    verify2FA: builder.mutation({
      query: (data) => ({
        url: '/auth/2fa/verify',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['2FA', 'User'],
    }),

    // Telemetry & Observability Metrics (4.3.2)
    getLiveTelemetry: builder.query({
      query: () => '/admin/telemetry/metrics',
      providesTags: ['AdminTelemetry'],
    }),

    disable2FA: builder.mutation({
      query: () => ({
        url: '/auth/2fa/disable',
        method: 'POST',
      }),
      invalidatesTags: ['2FA', 'User'],
    }),
  }),
});

export const {
  useVerifyStepUpMutation,
  useGetPlatformMetricsQuery,
  useGetLiveTelemetryQuery,
  useGetUsersQuery,
  useSuspendUserMutation,
  useReinstateUserMutation,
  useGetAdminProductsQuery,
  useModerateProductMutation,
  useForceRefundMutation,
  useGetAuditLogsQuery,
  useGet2FAStatusQuery,
  useSetup2FAMutation,
  useVerify2FAMutation,
  useDisable2FAMutation,
} = adminApi;
