import { createApi } from "@reduxjs/toolkit/query/react";
import { Address } from "@/types/address";
import { API_ENDPOINTS } from "@/lib/constants/api";
import { baseQueryWithReauth as createBaseQueryWithReauth } from "@/lib/redux/apis/baseQueryWithReauth";

const baseQueryWithReauth = createBaseQueryWithReauth(API_ENDPOINTS.AUTH.BASE_URL);

export const addressApi = createApi({
  reducerPath: "addressApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Address'],
  endpoints: (builder) => ({
    getAddresses: builder.query<Address[], void>({
      query: () => "address",
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'Address' as const, id })),
            { type: 'Address', id: 'LIST' },
          ]
          : [{ type: 'Address', id: 'LIST' }],
    }),
    createAddress: builder.mutation<Address, Partial<Address>>({
      query: (body) => ({
        url: "address",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: 'Address', id: 'LIST' }],
    }),
    updateAddress: builder.mutation<Address, { id: number; body: Partial<Address> }>({
      query: ({ id, body }) => ({
        url: `address`,
        method: "PUT",
        body,
      }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          addressApi.util.updateQueryData('getAddresses', undefined, (draft) => {
            const newDefault = draft.find(address => address.id === id);
            const oldDefault = draft.find(address => address.is_default);
            if (oldDefault) oldDefault.is_default = false;
            if (newDefault) newDefault.is_default = true;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Address', id: 'LIST' }],
    }),
    deleteAddress: builder.mutation<{ success: boolean; id: number }, { id: number }>({
      query: (body) => ({
        url: `address`,
        method: "DELETE",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Address', id }],
    }),
  }),
});

export const {
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} = addressApi;
