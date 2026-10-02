import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logout } from './authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:5000/api/v1',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Attempt silent refresh
    const refreshResult = await baseQuery({ url: '/auth/refresh', method: 'POST' }, api, extraOptions);
    if (refreshResult.data && refreshResult.data.data?.accessToken) {
      // Store new access token in Redux state (in-memory only, per SEC-02)
      api.dispatch(setCredentials({ token: refreshResult.data.data.accessToken }));
      // Retry the original failed query with new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  // 'Address' (singular) is what orderApi.js uses. 'Addresses' is kept in case
  // other files still reference it.
  tagTypes: [
    'Cart',
    'Products',
    'Product',
    'Orders',
    'Order',
    'User',
    'Reviews',
    'Categories',
    'Wishlist',
    'Address',
    'Addresses',
    'PaymentStatus',
    'SellerOrder',
    'Sessions',
  ],
  endpoints: () => ({}),
});