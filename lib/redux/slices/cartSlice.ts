

import { createSlice } from "@reduxjs/toolkit";
import { CartItem, CartState } from "@/types/cart";
import { cartApi } from "../apis/cartApi";
const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      cartApi.endpoints.getCart.matchFulfilled,
      (state, { payload }) => {
        state.items = payload.items;
      }
    );
  },
});
export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
