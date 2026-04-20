

import { createSlice } from "@reduxjs/toolkit";
import { authApi } from "../apis/authApi";

import { User, AuthState } from "@/types/auth";

const initialState: AuthState = {
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem("isAuthenticated");
      }
    },
    syncAuthState: (state) => {
      if (typeof window !== 'undefined') {
        state.isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        authApi.endpoints.login.matchFulfilled,
        (state, { payload }) => {
          state.isAuthenticated = true;
          if (typeof window !== "undefined") {
            localStorage.setItem("isAuthenticated", "true");
          }
        }
      )
      .addMatcher(
        authApi.endpoints.googleLogin.matchFulfilled,
        (state, { payload }) => {
          state.isAuthenticated = true;
          if (typeof window !== "undefined") {
            localStorage.setItem("isAuthenticated", "true");
          }
        }
      )
      .addMatcher(
        authApi.endpoints.verifyEmail.matchFulfilled,
        (state, { payload }) => {
          // Only authenticate if backend returns access token
          if (payload?.access_token) {
            state.isAuthenticated = true;

            if (typeof window !== "undefined") {
              localStorage.setItem("isAuthenticated", "true");
            }
          }
        }
      )

  },
});

export const { logout, syncAuthState } = authSlice.actions;
export default authSlice.reducer;
