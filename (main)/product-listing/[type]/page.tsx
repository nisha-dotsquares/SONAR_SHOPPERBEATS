
import { Metadata } from "next";
import { API_ENDPOINTS } from "@/lib/constants/api";
import { Filter, Category } from "@/types/product";
import ProductListingClient from "@/components/pages/ProductListingClient";
import { cookies } from "next/headers";

interface ProductListingPageProps {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Function to map URL 'type' to API 'category_id' or a specific filter

function getApiCategoryParam(typeSlug: string): string | undefined {

  const typeMap: Record<string, string> = {
    "clearance": "clearance",
    "best-sellers": "best-sellers",
    "new-releases": "new-releases",
    "hot-deals": "hot-deals",
    "popular": "popular",
    "today-s-deal": "today-s-deal",
    "whats-on-sale": "whats-on-sale",
  };
  return typeMap[typeSlug] || typeSlug; // Default to using the slug directly if no map
}

export async function generateMetadata({
  params,
}: ProductListingPageProps): Promise<Metadata> {
  const { type } = await params;
  const title = type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `${title} Products - Shopper Beats`,
    description: `Browse our ${title.toLowerCase()} products at Shopper Beats.`,
  };
}

async function fetchProductData(
  typeSlug: string,
  searchParams: { [key: string]: string | string[] | undefined },
  allCookies?: string
) {
  const isPersonalized = typeSlug === "personalized";
  const isRecentlyViewed = typeSlug === "recently-viewed";
  const isHighlight = [
    "best-sellers",
    "top-rated",
    "trending-deals",
    "clearance",
    "new-releases",
    "hot-deals",
    "popular",
    "today-s-deal",
    "whats-on-sale",
  ].includes(typeSlug);

  const isFilterOnly = [
    "free-shipping",
    "coupons",
    "price-drop",
  ].includes(typeSlug);

  const apiCategoryParam = getApiCategoryParam(typeSlug);

  if (!apiCategoryParam && !isPersonalized && !isHighlight && !isRecentlyViewed && !isFilterOnly) {
    return {
      products: [],
      totalItems: 0,
      filters: [],
      category: null,
      megaMenuData: [],
    };
  }

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

  if (searchParams.sort_by) {
    queryParams.set("sort_by", String(searchParams.sort_by));
  }

  let productApiUrl = "";
  let fetchOptions: RequestInit = { cache: "no-store", headers: { Cookie: allCookies || "" } };

  if (isPersonalized) {
    productApiUrl = `${process.env.NEXT_PUBLIC_API_URL_PRODUCTS}${API_ENDPOINTS.PRODUCTS.PERSONALIZED}`;
  } else if (isRecentlyViewed) {
    productApiUrl = `${process.env.NEXT_PUBLIC_API_URL_PRODUCTS}${API_ENDPOINTS.PRODUCTS.RECENTLY_VIEWED}`;
  } else if (isHighlight) {
    productApiUrl = `${process.env.NEXT_PUBLIC_API_URL_PRODUCTS}${API_ENDPOINTS.PRODUCTS.HIGHLIGHTS}/${apiCategoryParam}`;
    if (queryParams.toString()) {
      productApiUrl += `?${queryParams.toString()}`;
    }
  } else if (isFilterOnly) {
    if (typeSlug === "free-shipping") {
      queryParams.set("free_shipping", "true");
      productApiUrl = `${process.env.NEXT_PUBLIC_API_URL_PRODUCTS}${API_ENDPOINTS.PRODUCTS.BASE_URL}/${API_ENDPOINTS.PRODUCTS.LIST_PRODUCTS}?${queryParams.toString()}`;
    } else if (typeSlug === "coupons") {
      productApiUrl = `${process.env.NEXT_PUBLIC_API_URL_PRODUCTS}${API_ENDPOINTS.PRODUCTS.BASE_URL}/${API_ENDPOINTS.PRODUCTS.LIST_PROMOTIONAL_PRODUCTS}?${queryParams.toString()}`;
    } else if (typeSlug === "price-drop") {
      queryParams.set("sort", "biggest_saving");
      productApiUrl = `${process.env.NEXT_PUBLIC_API_URL_PRODUCTS}${API_ENDPOINTS.PRODUCTS.BASE_URL}/${API_ENDPOINTS.PRODUCTS.LIST_PRODUCTS}?${queryParams.toString()}`;
    }

  } else {
    // Use the mapped typeSlug as category_id
    queryParams.set("category_slug", apiCategoryParam || "");
    productApiUrl = `${process.env.NEXT_PUBLIC_API_URL_PRODUCTS}${API_ENDPOINTS.PRODUCTS.BASE_URL}/${API_ENDPOINTS.PRODUCTS.LIST_PRODUCTS}?${queryParams.toString()}`;
  }

  try {
    const productsRes = await fetch(productApiUrl, fetchOptions); // No-store for dynamic data
    console.log("productsRes", productsRes);
    if (!productsRes.ok) {
      console.error(`Failed to fetch products for type: ${typeSlug}`, productsRes.statusText);
      return {
        products: [],
        totalItems: 0,
        filters: [],
        category: null,
        megaMenuData: [],
      };
    }
    const productsData = await productsRes.json();
    console.log("productsData", productsData);

    // Highlights return their payload nested differently
    const resolvedData = isHighlight ? productsData.products : productsData;

    const filters: Filter[] = resolvedData?.filters || [];

    const megaMenuData: Category[] = []; // Placeholder


    const category: Category = {
      id: isPersonalized ? "personalized" : (isHighlight ? typeSlug : (apiCategoryParam || "")),
      name: isHighlight ? (productsData?.title || productsData?.type || typeSlug) : typeSlug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      slug: typeSlug,
      product_count: resolvedData?.total || (Array.isArray(resolvedData?.data) ? resolvedData.data.length : 0),
    }; // Placeholder, ideally fetched from a category API based on apiCategoryParam


    return {
      products: Array.isArray(resolvedData) ? resolvedData : (resolvedData?.data || []),
      totalItems: resolvedData?.total || 0,
      filters,
      category,
      megaMenuData,
      bannerImage: productsData?.banner_image || null,
    };
  } catch (error) {
    console.error(`Error fetching product data for type: ${typeSlug}`, error);
    return {
      products: [],
      totalItems: 0,
      filters: [],
      category: null,
      megaMenuData: [],
      bannerImage: null,
    };
  }
}

export default async function ProductListingPage({
  params,
  searchParams,
}: ProductListingPageProps) {
  const { type } = await params;
  const resolvedSearchParams = await searchParams;

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll().map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");

  // Fetch initial data on the server
  const { products, totalItems, filters, category, bannerImage } =
    await fetchProductData(type, resolvedSearchParams, allCookies);
  return (
    <ProductListingClient
      slug={type}
      category={category}
      products={products}
      filters={filters}
      totalItems={totalItems}
      megaMenuData={[]}
      bannerImage={bannerImage}
    />
  );
}
