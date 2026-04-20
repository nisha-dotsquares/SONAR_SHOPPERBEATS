import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { API_ENDPOINTS } from "../../constants/api";
import { logout } from "@/lib/redux/slices/authSlice";
import { CapturePaymentResponse } from "@/types/cart";

const baseQuery = fetchBaseQuery({
  baseUrl: API_ENDPOINTS.PAYMENT.BASE_URL,
  credentials: "include",
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    api.dispatch(logout());
  }
  return result;
};

export const paymentApi = createApi({
  reducerPath: "paymentApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    initiatePayment: builder.mutation<
      { payment_id: string; client_secret: string; approval_url: string | null },
      { order_id: string; provider: string }
    >({
      query: (body) => ({
        url: API_ENDPOINTS.PAYMENT.INITIATE,
        method: "POST",
        body,
      }),
    }),
    capturePayment: builder.mutation<CapturePaymentResponse, { token: string }>({
      query: ({ token }) => ({
        url: `${API_ENDPOINTS.PAYMENT.CAPTURE}?token=${token}`,
        method: "POST",
      }),
    }),
  }),
});

export const { useInitiatePaymentMutation, useCapturePaymentMutation } = paymentApi;
