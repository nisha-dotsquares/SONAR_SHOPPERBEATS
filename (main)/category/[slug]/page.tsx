import CategoryPageClient from "@/components/pages/CategoryPageClient";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { getMegaMenuData } from "@/lib/utils/getMegaMenuData";
import { Category, ProductsResponse } from "@/types/product";


// ---------- Generate Metadata ----------
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryDetails(slug);

  return {
    title: category?.name
      ? `${category.name} - Shopperbeats`
      : "Category - Shopperbeats",
    description:
      category?.description ||
      `Browse products in the ${category?.name || "selected"} category on Shopperbeats.`,
    openGraph: {
      title: category?.name
        ? `${category.name} - Shopperbeats`
        : "Category - Shopperbeats",
      description:
        category?.description ||
        `Browse products in the ${category?.name || "selected"} category on Shopperbeats.`,
      url: `https://shopperbeats.com/category/${slug}`,
      images: [
        {
          url: "https://shopperbeats.com/images/logo.svg", // Replace 
          alt: category?.name || "Shopperbeats Category",
        },
      ],
      siteName: "Shopperbeats",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: category?.name
        ? `${category.name} - Shopperbeats`
        : "Category - Shopperbeats",
      description:
        category?.description ||
        `Browse products in the ${category?.name || "selected"} category on Shopperbeats.`,
      images: ["https://shopperbeats.com/images/logo.svg"], // Replace 
    },
  };
}

// ---------- Fetch Category Details ----------
async function getCategoryDetails(slug: string) {
  const baseUrl = API_ENDPOINTS.PRODUCTS.PRODUCTS_API_BASE_URL;

  if (!baseUrl) {
    console.error("NEXT_PUBLIC_API_URL_PRODUCTS is missing");
    return null;
  }

  try {
    const res = await fetch(
      `${baseUrl}${API_ENDPOINTS.CATEGORIES.BY_SLUG(slug)}`,
      {
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      console.error("Failed to fetch category details:", res.status);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching category details:", error);
    return null;
  }
}



// ---------- Fetch Products ----------
async function getProducts(
  categorySlug: string,
  searchParams: { [key: string]: string | string[] | undefined }
): Promise<ProductsResponse> {
  const queryParams = new URLSearchParams();
  queryParams.set("category_slug", categorySlug);

  for (const key in searchParams) {
    const value = searchParams[key];
    if (value !== undefined) {
      // Exclude price filters from SSR — they restrict the filter list returned by the API
      if (["price_ranges", "min_price", "max_price"].includes(key.toLowerCase())) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, v));
      } else {
        queryParams.append(key, String(value));
      }
    }
  }

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
    return { data: [], filters: [], totalItems: 0 };
  }
}

// ---------- Page Component ----------
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };

}) {
  //  Await both async props
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  const category = await getCategoryDetails(slug);
  const { data: products, filters, totalItems } = await getProducts(
    slug,
    resolvedSearchParams
  );

  const megaMenuData: Category[] = await getMegaMenuData();

  return (
    <>
      <Breadcrumb />
      <CategoryPageClient
        megaMenuData={megaMenuData}
        slug={slug}
        category={category}
        products={products}
        filters={filters}
        totalItems={totalItems}
      />
    </>
  );
}
