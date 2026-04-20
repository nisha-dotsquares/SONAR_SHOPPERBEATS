import {
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { logout } from "@/lib/redux/slices/authSlice";

export const baseQueryWithReauth = (
  baseUrl: string
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> => {
  const baseQuery = fetchBaseQuery({
    baseUrl,
    credentials: "include",
  });

  return async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
      api.dispatch(logout());

      // if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      //   window.location.href = "/login";
      // }
    }

    return result;
  };
};
