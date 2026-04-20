
import SearchPageClient from "@/components/pages/SearchPageClient";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { API_ENDPOINTS } from "@/lib/constants/api";
import { Product, ProductsResponse } from "@/types/product";
import type { Metadata } from "next";
import "../../../styles/Product.css";

// ---------- Generate Metadata ----------
export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || "";

  return {
    title: `Search results for "${query}" - Shopperbeats`,
    description: `Find the best deals on ${query} at Shopperbeats.`,
    openGraph: {
      title: `Search results for "${query}" - Shopperbeats`,
      description: `Find the best deals on ${query} at Shopperbeats.`,
      url: `https://shopperbeats.com/search?q=${query}`,
      images: [
        {
          url: "https://shopperbeats.com/images/logo.svg",
          alt: `Search results for "${query}"`,
        },
      ],
      siteName: "Shopperbeats",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Search results for "${query}" - Shopperbeats`,
      description: `Find the best deals on ${query} at Shopperbeats.`,
      images: ["https://shopperbeats.com/images/logo.svg"],
    },
  };
}

// ---------- Fetch Products ----------
async function getProducts(
  searchParams: { [key: string]: string | string[] | undefined }
): Promise<ProductsResponse> {
  const queryParams = new URLSearchParams();

  for (const key in searchParams) {
    const value = searchParams[key];
    if (value !== undefined) {
      // Exclude price filters from SSR — they restrict the filter list returned by the API
      if (["price_ranges", "min_price", "max_price"].includes(key.toLowerCase())) continue;
      if (key === "q") {
        queryParams.append("name", String(value));
      } else {
        if (Array.isArray(value)) {
          value.forEach((v) => queryParams.append(key, v));
        } else {
          queryParams.append(key, String(value));
        }
      }
    }
  }

  // Explicitly forward sort_by if it exists
  if (searchParams.sort_by) {
    queryParams.set("sort_by", String(searchParams.sort_by));
  }

  // Ensure page and limit are set for SSR (limit strictly capped to 10 to prevent 422 API errors if user selects 150)
  if (!queryParams.has("page")) queryParams.set("page", "1");
  queryParams.set("limit", "20");

  try {
    const res = await fetch(
      `${API_ENDPOINTS.PRODUCTS.PRODUCTS_API_BASE_URL}${API_ENDPOINTS.PRODUCTS.BASE_URL}/${API_ENDPOINTS.PRODUCTS.LIST_PRODUCTS}?${queryParams.toString()}`
    );

    if (!res.ok) {
      throw new Error("Failed to fetch products");
    }

    const data = await res.json();
    return { data: data.data, filters: data.filters, totalItems: data.total };
  } catch (error) {
    console.error(error);
    return { data: [] as (Product & { attributes: { name: string; value: string; }[]; })[], filters: [], totalItems: 0 };
  }
}

// ---------- Page Component ----------
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  const query = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";

  const { data: products, filters, totalItems } = await getProducts(
    resolvedSearchParams
  );

  return (
    <>
      <Breadcrumb />
      <SearchPageClient
        query={query}
        products={products}
        filters={filters}
        totalItems={totalItems}
      />
    </>
  );
}
