import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { API_ENDPOINTS } from "@/lib/constants/api";
import { logout } from "@/lib/redux/slices/authSlice";
import { VendorRequestPayload, VendorRequestResponse } from "@/types/cart";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL_USERS,
  credentials: "include",
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    api.dispatch(logout());
  }
  return result;
};

export const vendorApi = createApi({
  reducerPath: "vendorApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    createVendorRequest: builder.mutation<VendorRequestResponse, VendorRequestPayload>({
      query: (body) => ({
        url: "admin/api/vendor/request",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useCreateVendorRequestMutation } = vendorApi;
