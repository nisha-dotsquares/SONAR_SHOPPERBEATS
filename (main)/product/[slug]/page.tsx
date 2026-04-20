import { cookies } from "next/headers";
import ProductDetailClient from "@/components/pages/ProductDetailClient";
import { getMegaMenuData } from "@/lib/utils/getMegaMenuData";
import { API_ENDPOINTS } from "@/lib/constants/api";
import { Category, Product, ProductApiResponse } from "@/types/product";
import { ProductSEO } from "@/types/seo";

async function getProduct(
  slug: string,
  cookieHeader?: string
): Promise<{ product: Product | null; setCookie?: string; seo?: ProductSEO }> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

  const res = await fetch(
      `${API_ENDPOINTS.PRODUCTS.PRODUCTS_API_BASE_URL}${API_ENDPOINTS.PRODUCTS.BASE_URL}/${API_ENDPOINTS.PRODUCTS.GET_PRODUCT}/${slug}`,
      {
        headers,
        next: { revalidate: 300 }, // ISR: product data cached 5 min
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch product");
    }

    const setCookie = res.headers.get("set-cookie") ?? undefined;

    const data: ProductApiResponse = await res.json();

    const product = {
      id: data.id,
      unique_code: data.unique_code,
      title: data.title,
      description: data.description,
      slug: data.slug,
      stock: data.stock,
      price: data.price,
      rrp_price: data.rrp_price,
      key_features: data.key_features,
      brand_name: data.brand_name,
      handling_time_days: data.handling_time_days,
      height: data.height,
      weight: data.weight,
      length: data.length,
      width: data.width,
      care_instructions: data?.care_instructions,
      precautionary_note: data?.precautionary_note,
      warranty: data?.warranty,
      ships_from_location: data.ships_from_location,
      status: data.status,
      brand_id: data.brand_id,
      brand_slug: data.brand_slug,
      images: data.images?.length
        ? data.images
        : [
          { image_url: "/images/image-coming-soon.jpg", is_main: true },
          { image_url: "/images/image-coming-soon.jpg", is_main: false },
          { image_url: "/images/image-coming-soon.jpg", is_main: false },
          { image_url: "/images/image-coming-soon.jpg", is_main: false },
          { image_url: "/images/image-coming-soon.jpg", is_main: false },
          { image_url: "/images/image-coming-soon.jpg", is_main: false },
        ],
      discount_percentage: data.discount_percentage,
      discounted_price: data.discounted_price,
      free_shipping: data.free_shipping,
      review_stats: data.review_stats,
      variants: data.variants,
      reviews: data.reviews,
      return: data.return_policy,
      category_id: data.category_id,
      fast_dispatch: data.fast_dispatch,
      sku: data.sku,
      bundle_group_code: data.bundle_group_code,
      bundle_products: data.bundle_products,
      promotion_name: data.promotion_name,
      vendor_id: data.vendor_id,
      tags: data.tags,
    };

    const seo = {
      page_title: data.seo?.page_title,
      meta_description: data.seo?.meta_description,
      meta_keywords: data.seo?.meta_keywords,
      canonical_url: data.seo?.canonical_url,
      url_handle: data.seo?.url_handle
    };

    return { product, setCookie, seo };
  } catch {
    return { product: null };
  }
}

async function getRecommendations(
  productId: string
): Promise<Product[] | null> {
  try {
    const res = await fetch(
      `${API_ENDPOINTS.PRODUCTS.PRODUCTS_API_BASE_URL}${API_ENDPOINTS.PRODUCTS.BASE_URL}/${API_ENDPOINTS.PRODUCTS.RECOMMENDATION}/?product_id=${productId}`, {
      next: {
        revalidate: 300,
      },
    }
    );

    if (!res.ok) {
      return [];
    }
    const data: ProductApiResponse[] = await res.json();

    return data.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      slug: item.slug,
      sku: item.sku,
      price: item.price,
      brand_name: item.brand_name,
      images: item.images,
      rrp_price: item.rrp_price,
      discount_percentage: item.discount_percentage,
      discounted_price: item.discounted_price,
      free_shipping: item.free_shipping,
      review_stats: item.review_stats,
      variants: item.variants,
      reviews: item.reviews,
      promotion_name: item.promotion_name,
      unique_code: item.unique_code,
      vendor_id: item.vendor_id,
      tags: item.tags,
    }));
  } catch {
    return [];
  }
}

async function getRecentlyViewed(cookieHeader?: string): Promise<Product[] | null> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    const res = await fetch(
      `${API_ENDPOINTS.PRODUCTS.PRODUCTS_API_BASE_URL}${API_ENDPOINTS.PRODUCTS.RECENTLY_VIEWED}`,
      {
        headers,
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data ?? [];
  } catch {
    return null;
  }
}

async function getPopularProducts(): Promise<Product[] | null> {
  try {
    const res = await fetch(
      `${API_ENDPOINTS.PRODUCTS.PRODUCTS_API_BASE_URL}${API_ENDPOINTS.PRODUCTS.HIGHLIGHTS}/popular`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    const items: ProductApiResponse[] = data?.products?.data || [];

    return items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      slug: item.slug,
      price: item.price,
      rrp_price: item.rrp_price,
      brand_name: item.brand_name,
      image:
        item.images && item.images.length > 0
          ? item.images?.find((img) => img.is_main)?.image_url
          : "/images/image-coming-soon.jpg",

      discount_percentage: item.discount_percentage,
      discounted_price: item.discounted_price,
      free_shipping: item.free_shipping,
      review_stats: item.review_stats,
      variants: item.variants,
      reviews: item.reviews,
      sku: item.sku,
      unique_code: item.unique_code,
      promotion_name: item.promotion_name,
      vendor_id: item.vendor_id,
      tags: item.tags,
    }));
  } catch {
    return null;
  }
}

export default async function ProductPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  const cookieStore = await cookies();
  const clientCookies = cookieStore.toString();

  const { product, setCookie, seo } = await getProduct(slug, clientCookies);

  if (!product) {
    return <div className="no-products">Product not found</div>;
  }

  // Fetch all secondary data in parallel
  const [recommendations, popularProducts, recentlyViewed, megaMenuData] = await Promise.all([
    product.id ? getRecommendations(product.id) : Promise.resolve(null),
    getPopularProducts(),
    getRecentlyViewed(clientCookies),
    getMegaMenuData(),
  ]);

  return (
    <ProductDetailClient
      product={product}
      seo={seo}
      recommendations={recommendations}
      popularProducts={popularProducts}
      recentlyViewed={recentlyViewed}
      megaMenuData={megaMenuData as Category[]}
      slug={slug}
    />
  );
}