import ProductsPageClient from "@/components/pages/ProductsPageClient";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { Product } from "@/types/product";

// ---------- Generate Metadata ----------
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "All Products - Shopperbeats",
    description: "Browse all products on Shopperbeats.",
    openGraph: {
      title: "All Products - Shopperbeats",
      description: "Browse all products on Shopperbeats.",
      url: "https://shopperbeats.com/products",
      images: [
        {
          url: "https://shopperbeats.com/images/logo.svg",
          alt: "Shopperbeats",
        },
      ],
      siteName: "Shopperbeats",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "All Products - Shopperbeats",
      description: "Browse all products on Shopperbeats.",
      images: ["https://shopperbeats.com/images/logo.svg"],
    },
  };
}

interface ProductsResponse {
  data: (Product & { attributes: { name: string; value: string; }[]; })[];
  totalItems: number;
}



// ---------- Fetch Products ----------
async function getProducts(
  searchParams: { [key: string]: string | string[] | undefined }
): Promise<ProductsResponse> {
  const queryParams = new URLSearchParams();

  for (const key in searchParams) {
    const value = searchParams[key];
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, v));
      } else {
        queryParams.append(key, String(value));
      }
    }
  }

  // Ensure page and limit are set if not provided in searchParams
  if (!queryParams.has("page")) queryParams.set("page", "1");
  if (!queryParams.has("limit")) queryParams.set("limit", "20");

  try {
    const res = await fetch(
      `${API_ENDPOINTS.PRODUCTS.PRODUCTS_API_BASE_URL}${API_ENDPOINTS.PRODUCTS.BASE_URL}/${API_ENDPOINTS.PRODUCTS.LIST_PRODUCTS}?${queryParams.toString()}`
    );

    if (!res.ok) {
      throw new Error("Failed to fetch products");
    }

    const data = await res.json();
    return { data: data.data, totalItems: data.total };
  } catch (error) {
    console.error(error);
    return { data: [], totalItems: 0 };
  }
}

// ---------- Page Component ----------
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  //  Await both async props
  const resolvedSearchParams = await searchParams;

  const { data: products, totalItems } = await getProducts(
    resolvedSearchParams
  );

  return (
    <>
      <Breadcrumb />
      <ProductsPageClient
        products={products}
        totalItems={totalItems}
      />
    </>
  );
}
