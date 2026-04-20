import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_ENDPOINTS } from "../../constants/api";

export const marketingApi = createApi({
  reducerPath: "marketingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_ENDPOINTS.MARKETING.BASE_URL,
  }),
  endpoints: (builder) => ({
    subscribeToMailingList: builder.mutation<
      { message?: string; response?: { response: string } },
      { email: string }
    >({
      query: (body) => ({
        url: API_ENDPOINTS.MARKETING.MAILING_LIST,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useSubscribeToMailingListMutation } = marketingApi;
