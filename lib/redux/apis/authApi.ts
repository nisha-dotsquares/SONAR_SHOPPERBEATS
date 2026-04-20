import { createApi } from "@reduxjs/toolkit/query/react";
import { API_ENDPOINTS } from "../../constants/api";
import { logout } from '../slices/authSlice';
import { clearCart } from '../slices/cartSlice';
import { UserDetails, PersonalData, LoginResponse, UpdatePersonalDataRequest, SocialMediaLink } from "@/types/auth";
import { addressApi } from "./addressApi";
import { cartApi } from "./cartApi";
import { orderApi } from "./orderApi";
import { baseQueryWithReauth as createBaseQueryWithReauth } from "./baseQueryWithReauth";

const baseQueryWithReauth = createBaseQueryWithReauth(API_ENDPOINTS.AUTH.BASE_URL);

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User", "PersonalData"],
  endpoints: (builder) => ({
    login: builder.mutation<
      LoginResponse,
      {
        email: string;
        password: string;
        recaptcha_token: string;
        remember_me?: boolean;
      }
    >({
      query: (credentials) => ({
        url: API_ENDPOINTS.AUTH.LOGIN,
        method: "POST",
        body: credentials,
      }),
    }),
    signup: builder.mutation<
      LoginResponse,
      {
        password2: string;
        email: string;
        password: string;
        recaptcha_token: string;
        addToMailingList?: boolean;
      }
    >({
      query: (credentials) => ({
        url: API_ENDPOINTS.AUTH.SIGNUP,
        method: "POST",
        body: credentials,
      }),
    }),
    forgotPassword: builder.mutation<
      { message: string },
      { email_address: string }
    >({
      query: (credentials) => ({
        url: API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        method: "POST",
        body: credentials,
      }),
    }),
    resetPassword: builder.mutation<
      { message: string },
      {
        password2: string;
        password1: string;
        uid: string;
        token: string;
        recaptcha_token: string;
      }
    >({
      query: (credentials) => ({
        url: API_ENDPOINTS.AUTH.RESET_PASSWORD,
        method: "POST",
        body: credentials,
      }),
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: API_ENDPOINTS.AUTH.LOGOUT,
        method: "POST",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(clearCart());
          dispatch(authApi.util.resetApiState());
          dispatch(addressApi.util.resetApiState());
          dispatch(cartApi.util.resetApiState());
          dispatch(orderApi.util.resetApiState());
          dispatch(logout());
        } catch (err) {
          console.error("Logout failed", err);
        }
      },
    }),

    getUserDetails: builder.query<UserDetails, void>({
      query: () => ({
        url: API_ENDPOINTS.AUTH.USER_DETAILS,
      }),
      providesTags: ["User"],
    }),
    updateUserDetails: builder.mutation<UserDetails, Partial<UserDetails>>({
      query: (body) => ({
        url: API_ENDPOINTS.AUTH.USER_DETAILS,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    verifyEmail: builder.mutation<{ message: string; access_token?: string; refresh_token?: string; user?: UserDetails }, { token: string }>({
      query: ({ token }) => ({
        url: API_ENDPOINTS.AUTH.VERIFY_EMAIL(token).replace(
          API_ENDPOINTS.AUTH.BASE_URL + "/",
          ""
        ),
        method: "GET",
      }),
    }),
    getPersonalData: builder.query<PersonalData, void>({
      query: () => API_ENDPOINTS.AUTH.PERSONAL_DATA,
      providesTags: ["PersonalData"],
    }),
    updatePersonalData: builder.mutation<
      PersonalData,
      UpdatePersonalDataRequest
    >({
      query: (body) => ({
        url: API_ENDPOINTS.AUTH.PERSONAL_DATA,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["PersonalData"],
    }),

    changePassword: builder.mutation<
      { message: string },
      { current_password: string; new_password: string }
    >({
      query: (credentials) => ({
        url: API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        method: "POST",
        body: credentials,
      }),
    }),
    resendVerificationCode: builder.mutation<
      { message: string },
      { email: string }
    >({
      query: (body) => ({
        url: "resend-verification-code",
        method: "POST",
        body,
      }),
    }),
    googleLogin: builder.mutation<LoginResponse, { access_token: string }>({
      query: (body) => ({
        url: API_ENDPOINTS.AUTH.GOOGLE_LOGIN,
        method: "POST",
        body,
      }),
    }),
    getSocialMediaLinks: builder.query<SocialMediaLink[], void>({
      queryFn: async () => {
        try {
          const res = await fetch(API_ENDPOINTS.SOCIAL_MEDIA.GET_LINKS);
          const data = await res.json();
          return { data };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
  useGetUserDetailsQuery,
  useUpdateUserDetailsMutation,
  useVerifyEmailMutation,
  useGetPersonalDataQuery,
  useUpdatePersonalDataMutation,
  useChangePasswordMutation,
  useResendVerificationCodeMutation,
  useGoogleLoginMutation,
  useGetSocialMediaLinksQuery,
} = authApi;
