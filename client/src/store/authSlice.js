import { createSlice } from '@reduxjs/toolkit';

const AUTH_STORAGE_KEY = 'shopsphere_auth';
const loadStoredAuth = () => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};
const storedAuth = loadStoredAuth();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedAuth.user || null,
    token: storedAuth.token || null,
    isAuthenticated: Boolean(storedAuth.token),
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      if (user) state.user = user;
      if (token) state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        user: state.user,
        token: state.token,
      }));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem(AUTH_STORAGE_KEY);
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
