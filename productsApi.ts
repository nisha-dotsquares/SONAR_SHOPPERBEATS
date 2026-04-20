import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_ENDPOINTS } from "../../constants/api";
import { Brand, Product } from "@/types/product";
import { ImageUploadResponse, ProductHighlightsResponse } from "@/types/api";

export const productsApi = createApi({
  reducerPath: "productsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_ENDPOINTS.PRODUCTS.PRODUCT_BASE_URL_CLIENT,
    credentials: "include",
  }),
  tagTypes: ["Brands"],
  endpoints: (builder) => ({
    getBrands: builder.query<Brand[], void>({
      query: () => ({
        url: `${API_ENDPOINTS.PRODUCTS.PRODUCTS_API_BASE_URL}/${API_ENDPOINTS.PRODUCTS.BRANDS_LIST}`,
        credentials: "include",
      }),
      providesTags: ["Brands"],
    }),

    getPopularProducts: builder.query<{ data: Product[] }, void>({
      query: () => API_ENDPOINTS.PRODUCTS.POPULAR,
    }),
    searchProducts: builder.query<{ data: Product[] }, string>({
      query: (name) => `${API_ENDPOINTS.PRODUCTS.LIST_PRODUCTS}?name=${name}`,
    }),
    getProducts: builder.query<
      { data: Product[]; total: number; limit: number },
      {
        sort_by?: string;
        min_price?: string;
        max_price?: string;
        categories?: string;
        price_ranges?: string;
        category_slug?: string;
        page?: number;
        limit?: number;
        [key: string]: string | number | undefined;
      }
    >({
      query: ({
        sort_by,
        min_price,
        max_price,
        categories,
        price_ranges,
        category_slug,
        page = 1,
        limit = 10,
        ...otherFilters
      }) => {
        let url = `${API_ENDPOINTS.PRODUCTS.LIST_PRODUCTS}`;
        const params = new URLSearchParams();
        if (sort_by) {
          params.append("sort_by", sort_by);
        }
        if (min_price) {
          params.append("min_price", min_price);
        }
        if (max_price) {
          params.append("max_price", max_price);
        }
        if (categories) {
          params.append("categories", categories.replace(/(^|\S)\s*\(\d+\)/g, "$1"));
        }
        if (price_ranges) {
          params.append(
            "price_ranges",
            price_ranges.replace(/(^|\S)\s*\(\d+\)/g, "$1")
          );
        }
        if (category_slug) {
          params.append("category_slug", category_slug);
        }
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        for (const key in otherFilters) {
          if (otherFilters[key]) {
            if (key.toLowerCase() === "shipping") {
              const val = String(otherFilters[key]).toLowerCase();

              if (val.includes("free shipping")) {
                params.append("free_shipping", "true");
              } else {
                params.append("free_shipping", "false");
              }

              if (val.includes("fast dispatch")) {
                params.append("fast_dispatch", "true");
              } else {
                params.append("fast_dispatch", "false");
              }
            } else {
              params.append(key, otherFilters[key] as string);
            }
          }
        }
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        return url;
      },
    }),
    getTrendingProducts: builder.query<{ data: Product[] }, void>({
      query: () => API_ENDPOINTS.PRODUCTS.TRENDING_PRODUCTS,
    }),
    getProductBySlug: builder.query<Product, string>({
      query: (slug) => `${API_ENDPOINTS.PRODUCTS.GET_PRODUCT}/${slug}`,
    }),
    uploadAnyImage: builder.mutation<ImageUploadResponse, FormData>({
      query: (formData) => ({
        url: API_ENDPOINTS.PRODUCTS.UPLOAD_ANY_IMAGE,
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const highlightsApi = createApi({
  reducerPath: "highlightsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: '',
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getProductHighlights: builder.query<ProductHighlightsResponse, string>({
      query: (idOrSlug) =>
        `${API_ENDPOINTS.PRODUCTS.HIGHLIGHTS}/${idOrSlug}`,
    }),
  }),
});


export const {
  useSearchProductsQuery,
  useGetProductsQuery,
  useGetPopularProductsQuery,
  useGetTrendingProductsQuery,
  useGetBrandsQuery,
  useGetProductBySlugQuery,
  useUploadAnyImageMutation,
} = productsApi;

export const { useGetProductHighlightsQuery } = highlightsApi;
