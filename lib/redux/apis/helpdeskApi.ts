import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_ENDPOINTS } from "../../constants/api";

import { ContactFormInput, ContactFormResponse } from "@/types/helpdesk";

export const helpdeskApi = createApi({
  reducerPath: "helpdeskApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_ENDPOINTS.HELPDESK.BASE_URL,
  }),
  endpoints: (builder) => ({
    contactUs: builder.mutation<ContactFormResponse, ContactFormInput>({
      query: (body) => ({
        url: API_ENDPOINTS.HELPDESK.CONTACT_US,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useContactUsMutation } = helpdeskApi;
