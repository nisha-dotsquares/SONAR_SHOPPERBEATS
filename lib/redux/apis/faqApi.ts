import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_ENDPOINTS } from "../../constants/api";

export interface FAQItem {
  id: number;
  type: string;
  question: string;
  answer: string;
  order: number;
}

export const faqApi = createApi({
  reducerPath: "faqApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_ENDPOINTS.FAQ.BASE_URL,
  }),
  endpoints: (builder) => ({
    getFaqs: builder.query<FAQItem[], void>({
      query: () => "",
    }),
  }),
});

export const { useGetFaqsQuery } = faqApi;
