import BrandPageClient from "@/components/pages/BrandPageClient";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { ProductsResponse } from "@/types/product";

// ---------- Generate Metadata ----------
export async function generateMetadata(
  { params }: { params: Promise<{ brandId: string }> }
): Promise<Metadata> {
  const { brandId } = await params;
  const brand = await getBrandDetails(brandId);

  return {
    title: brand?.name
      ? `${brand.name} - Shopperbeats`
      : "Brand - Shopperbeats",
    description:
      `Browse products from ${brand?.name || "selected brand"} on Shopperbeats.`,
    openGraph: {
      title: brand?.name
        ? `${brand.name} - Shopperbeats`
        : "Brand - Shopperbeats",
      description:
        `Browse products from ${brand?.name || "selected brand"} on Shopperbeats.`,
      url: `https://shopperbeats.com/brand/${brandId}`,
      images: [
        {
          url: brand?.logo_url || "https://shopperbeats.com/images/logo.svg",
          alt: brand?.name || "Shopperbeats Brand",
        },
      ],
      siteName: "Shopperbeats",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: brand?.name
        ? `${brand.name} - Shopperbeats`
        : "Brand - Shopperbeats",
      description:
        `Browse products from ${brand?.name || "selected brand"} on Shopperbeats.`,
      images: [brand?.logo_url || "https://shopperbeats.com/images/logo.svg"],
    },
  };
}

// ---------- Fetch Brand Details ----------
async function getBrandDetails(brandId: string) {
  const baseUrl = API_ENDPOINTS.PRODUCTS.PRODUCTS_API_BASE_URL;

  if (!baseUrl) {
    console.error("NEXT_PUBLIC_API_URL_PRODUCTS is missing");
    return null;
  }

  try {
    const res = await fetch(
      `${baseUrl}/api/v1/brand/get-brand-by-slug/${brandId}`,
      {
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      console.error("Failed to fetch brand details:", res.status);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching brand details:", error);
    return null;
  }
}

// ---------- Fetch Products ----------
async function getProducts(
  brandId: string,
  searchParams: { [key: string]: string | string[] | undefined }
): Promise<ProductsResponse> {
  const queryParams = new URLSearchParams();
  queryParams.set("brand_slug", brandId);

  for (const key in searchParams) {
    const value = searchParams[key];
    if (value !== undefined) {
      // Exclude page, limit, and price filters from SSR — price filters restrict filter options from the API
      if (key === "page" || key === "limit" || ["price_ranges", "min_price", "max_price"].includes(key.toLowerCase())) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, v));
      } else {
        queryParams.append(key, String(value));
      }
    }
  }

  // Ensure page and limit are set
  queryParams.set("page", typeof searchParams.page === "string" ? searchParams.page : "1");
  queryParams.set("limit", typeof searchParams.limit === "string" ? searchParams.limit : "20");

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
    return { data: [], filters: [], totalItems: 0 };
  }
}

// ---------- Page Component ----------
export default async function BrandPage({
  params,
  searchParams,
}: {
  params: { brandId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { brandId } = await params;
  const resolvedSearchParams = await searchParams;

  const page =
    typeof resolvedSearchParams.page === "string"
      ? Number(resolvedSearchParams.page)
      : 1;

  const limit =
    typeof resolvedSearchParams.limit === "string"
      ? Number(resolvedSearchParams.limit)
      : 10;

  const brand = await getBrandDetails(brandId);
  const { data: products, filters, totalItems } = await getProducts(
    brandId,
    resolvedSearchParams
  );

  return (
    <>
      <Breadcrumb />
      <BrandPageClient
        brandId={brandId}
        brand={brand}
        products={products}
        filters={filters}
        totalItems={totalItems}
      />
    </>
  );
}