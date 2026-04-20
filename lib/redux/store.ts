import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { highlightsApi, productsApi } from "./apis/productsApi";
import { authApi } from "./apis/authApi";
import { cartApi } from "./apis/cartApi";

import { orderApi } from "./apis/orderApi";
import { addressApi } from "./apis/addressApi";
import { helpdeskApi } from "./apis/helpdeskApi";
import { paymentApi } from "./apis/paymentApi";
import { marketingApi } from "./apis/marketingApi";
import { vendorApi } from "./apis/vendorApi";
import { faqApi } from "./apis/faqApi";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import breadcrumbReducer from "./slices/breadcrumbSlice";
import loaderReducer from "./slices/loaderSlice";
import postcodeReducer from "./slices/postcodeSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  breadcrumb: breadcrumbReducer,
  loader: loaderReducer,
  postcode: postcodeReducer,
  [productsApi.reducerPath]: productsApi.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [cartApi.reducerPath]: cartApi.reducer,
  [highlightsApi.reducerPath]: highlightsApi.reducer,

  [orderApi.reducerPath]: orderApi.reducer,
  [helpdeskApi.reducerPath]: helpdeskApi.reducer,
  [addressApi.reducerPath]: addressApi.reducer,
  [marketingApi.reducerPath]: marketingApi.reducer,
  [paymentApi.reducerPath]: paymentApi.reducer,
  [vendorApi.reducerPath]: vendorApi.reducer,
  [faqApi.reducerPath]: faqApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const makeStore = () => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        },
      }).concat(
        productsApi.middleware,
        authApi.middleware,
        cartApi.middleware,
        highlightsApi.middleware,
        orderApi.middleware,
        helpdeskApi.middleware,
        addressApi.middleware,
        marketingApi.middleware,
        paymentApi.middleware,
        vendorApi.middleware,
        faqApi.middleware
      ),
    devTools: process.env.NODE_ENV !== 'production',
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];

export const store = makeStore();