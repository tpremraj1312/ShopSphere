import { createSlice } from '@reduxjs/toolkit';

const COMPARE_STORAGE_KEY = 'shopsphere_compare';
const MAX_COMPARE_ITEMS = 4;

const loadStoredCompare = () => {
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
};

const compareSlice = createSlice({
  name: 'compare',
  initialState: {
    items: loadStoredCompare(),
    maxLimitReached: false,
  },
  reducers: {
    addToCompare: (state, action) => {
      const product = action.payload;
      const id = product._id || product.id;
      const exists = state.items.some((item) => (item._id || item.id) === id);

      if (!exists) {
        if (state.items.length >= MAX_COMPARE_ITEMS) {
          state.maxLimitReached = true;
          return;
        }
        state.items.push(product);
        state.maxLimitReached = false;
        try {
          localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(state.items));
        } catch (e) {}
      }
    },
    removeFromCompare: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((item) => (item._id || item.id) !== id);
      state.maxLimitReached = false;
      try {
        localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(state.items));
      } catch (e) {}
    },
    toggleCompare: (state, action) => {
      const product = action.payload;
      const id = product._id || product.id;
      const index = state.items.findIndex((item) => (item._id || item.id) === id);

      if (index >= 0) {
        state.items.splice(index, 1);
        state.maxLimitReached = false;
      } else {
        if (state.items.length >= MAX_COMPARE_ITEMS) {
          state.maxLimitReached = true;
          return;
        }
        state.items.push(product);
        state.maxLimitReached = false;
      }
      try {
        localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(state.items));
      } catch (e) {}
    },
    clearCompare: (state) => {
      state.items = [];
      state.maxLimitReached = false;
      try {
        localStorage.removeItem(COMPARE_STORAGE_KEY);
      } catch (e) {}
    },
    resetMaxLimitWarning: (state) => {
      state.maxLimitReached = false;
    },
  },
});

export const {
  addToCompare,
  removeFromCompare,
  toggleCompare,
  clearCompare,
  resetMaxLimitWarning,
} = compareSlice.actions;

export const selectCompareItems = (state) => state.compare.items;
export const selectCompareCount = (state) => state.compare.items.length;
export const selectIsInCompare = (id) => (state) =>
  state.compare.items.some((item) => (item._id || item.id) === id);
export const selectMaxLimitReached = (state) => state.compare.maxLimitReached;

export default compareSlice.reducer;
