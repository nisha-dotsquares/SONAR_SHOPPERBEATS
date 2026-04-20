// @ts-nocheck

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Breadcrumb, BreadcrumbState } from "@/types/breadcrumb";

const initialState: BreadcrumbState = {
  categoryHistory: [{ name: "Home", path: "/" }],
};

const breadcrumbSlice = createSlice({
  name: "breadcrumb",
  initialState,
  reducers: {
    addBreadcrumb: (state, action: PayloadAction<Breadcrumb>) => {
      const existingIndex = state.categoryHistory.findIndex(
        (item) => item.path === action.payload.path
      );

      if (existingIndex !== -1) {
        // Keep only up to that category (avoid duplication)
        state.categoryHistory = state.categoryHistory.slice(
          0,
          existingIndex + 1
        );
      } else {
        // Add in hierarchy order (append)
        state.categoryHistory.push(action.payload);
      }
    },

    setBreadcrumbs: (state, action: PayloadAction<Breadcrumb[]>) => {
      // Replace entire breadcrumb hierarchy
      state.categoryHistory = [{ name: "Home", path: "/" }, ...action.payload];
    },

    resetBreadcrumbs: (state) => {
      // Reset to only Home
      state.categoryHistory = [{ name: "Home", path: "/" }];
    },
  },
});

export const { addBreadcrumb, setBreadcrumbs, resetBreadcrumbs } =
  breadcrumbSlice.actions;
export default breadcrumbSlice.reducer;
