

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_ENDPOINTS } from "../../constants/api";

import { OrderItemPayload, AddressPayload, OrderPayload, CreateOrderResponse, CancelOrderResponse, ReturnOrderPayload, OrderAPIResponse, ReturnOption, OrderActionResponse, AddReviewPayload, AddReviewResponse, ListOrdersParams } from "@/types/order";

const baseOrderQuery = fetchBaseQuery({
  baseUrl: API_ENDPOINTS.ORDER.BASE_URL,
  credentials: "include",
});

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: baseOrderQuery,
  endpoints: (builder) => ({
    createOrder: builder.mutation<CreateOrderResponse, OrderPayload>({
      query: (orderData) => ({
        url: API_ENDPOINTS.ORDER.CREATE,
        method: "POST",
        body: orderData,
      }),
    }),

    getOrderById: builder.query<OrderAPIResponse, string>({
      query: (orderId: string) => ({
        url: `${API_ENDPOINTS.ORDER.DETAIL}/${orderId}`,
        method: "GET",
      }),
    }),

    listOrders: builder.query<{ data: OrderAPIResponse[]; total_items: number }, ListOrdersParams>({
      query: (params) => ({
        url: API_ENDPOINTS.ORDER.LIST,
        method: "GET",
        params,
      }),
    }),
    cancelOrder: builder.mutation<CancelOrderResponse, { order_id: string; reason?: string }>({
      query: ({ order_id, reason }) => ({
        url: API_ENDPOINTS.ORDER.CANCEL_ORDER(order_id),
        method: "POST",
        body: reason ? { reason } : undefined,
      }),
    }),
    cancelOrderItem: builder.mutation<OrderActionResponse, { id: string | number; reason?: string }>({
      query: ({ id, reason }) => ({
        url: API_ENDPOINTS.ORDER.CANCEL_ITEM(id),
        method: "PATCH",
        body: reason ? { reason } : undefined,
      }),
    }),
    getReturnOptions: builder.query<ReturnOption[], void>({
      query: () => ({
        url: API_ENDPOINTS.ORDER.RETURN_OPTIONS,
        method: "GET",
      }),
    }),
    returnOrder: builder.mutation<OrderActionResponse, ReturnOrderPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.ORDER.RETURN(body.order_id!),
        method: "POST",
        body,
      }),
    }),
    returnOrderItem: builder.mutation<OrderActionResponse, ReturnOrderPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.ORDER.RETURN_ITEM(body.item_id!),
        method: "POST",
        body,
      }),
    }),
    replaceOrder: builder.mutation<OrderActionResponse, ReturnOrderPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.ORDER.RETURN(body.order_id!),
        method: "POST",
        body,
      }),
    }),
    replaceOrderItem: builder.mutation<OrderActionResponse, ReturnOrderPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.ORDER.RETURN_ITEM(body.item_id! as string),
        method: "POST",
        body,
      }),
    }),
    calculateShipping: builder.mutation<
      {
        product_identifier: string;
        postcode: string;
        zone: string;
        shipping_type: string;
        shipping_cost: string;
        message: string;
      },
      { postcode: string; product_identifier?: string }
    >({
      query: ({ postcode, product_identifier }) => ({
        url: API_ENDPOINTS.ORDER.SHIPPING_CHARGE,
        method: "GET",
        params: {
          postcode,
          ...(product_identifier ? { product_identifier } : {})
        },
      }),
    }),
    addReview: builder.mutation<AddReviewResponse, AddReviewPayload>({
      query: (body) => ({
        url: API_ENDPOINTS.ORDER.ADD_REVIEW,
        method: "POST",
        body,
      }),
    }),
    retryPayment: builder.mutation<
      {
        order_id: string;
        shipping_cost: number;
        payment_id: string;
        client_secret: string;
        approval_url: string | null;
      },
      {
        order_id: string;
        payment_method: { type: string; provider: string };
      }
    >({
      query: ({ order_id, payment_method }) => ({
        url: API_ENDPOINTS.ORDER.RETRY_PAYMENT(order_id),
        method: "POST",
        body: { payment_method },
      }),
    }),
  }),
});

export const { useCreateOrderMutation, useListOrdersQuery, useGetOrderByIdQuery, useCancelOrderMutation, useCancelOrderItemMutation, useCalculateShippingMutation, useGetReturnOptionsQuery, useReturnOrderMutation, useReturnOrderItemMutation, useReplaceOrderMutation, useReplaceOrderItemMutation, useAddReviewMutation, useRetryPaymentMutation } = orderApi;
