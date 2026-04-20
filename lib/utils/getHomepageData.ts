import { API_ENDPOINTS } from "@/lib/constants/api";
import { cookies } from "next/headers";

const baseUrl = API_ENDPOINTS.PRODUCTS.PRODUCTS_API_BASE_URL;

// Static data — safe to cache with ISR (60s revalidate)
async function getStaticHomepageData() {
  const results = await Promise.allSettled([
    fetch(`${baseUrl}${API_ENDPOINTS.PRODUCTS.HOMEPAGE_SECTION_BY_ID(API_ENDPOINTS.PRODUCTS.HERO_BANNER)}`, { next: { revalidate: 60 } }),
    fetch(`${baseUrl}${API_ENDPOINTS.PRODUCTS.HOMEPAGE_SECTION_BY_ID(API_ENDPOINTS.PRODUCTS.TOP_CATEGORIES)}`, { next: { revalidate: 60 } }),
    fetch(`${baseUrl}${API_ENDPOINTS.PRODUCTS.HOMEPAGE_SECTION_BY_ID(API_ENDPOINTS.PRODUCTS.BANNER_ONE)}`, { next: { revalidate: 60 } }),
    fetch(`${baseUrl}${API_ENDPOINTS.PRODUCTS.HOMEPAGE_SECTION_BY_ID(API_ENDPOINTS.PRODUCTS.BANNER_TWO)}`, { next: { revalidate: 60 } }),
    fetch(`${baseUrl}${API_ENDPOINTS.PRODUCTS.HIGHLIGHTS}/${API_ENDPOINTS.PRODUCTS.TRENDING_DEALS}`, { next: { revalidate: 60 } }),
    fetch(`${baseUrl}${API_ENDPOINTS.PRODUCTS.BRANDS_LIST}`, { next: { revalidate: 300 } }),
    fetch(`${baseUrl}${API_ENDPOINTS.PRODUCTS.HIGHLIGHTS}/${API_ENDPOINTS.PRODUCTS.TOP_RATED}`, { next: { revalidate: 60 } }),
    fetch(`${baseUrl}${API_ENDPOINTS.PRODUCTS.HIGHLIGHTS}${API_ENDPOINTS.PRODUCTS.BESTSELLERS}`, { next: { revalidate: 60 } }),
    fetch(`${baseUrl}/${API_ENDPOINTS.PRODUCTS.HOMEPAGE_SECTION_BY_ID(API_ENDPOINTS.PRODUCTS.CUSTOMER_REVIEWS)}`, { next: { revalidate: 300 } }),
  ]);

  const [heroBanner, topCategories, bannerOne, bannerTwo, trending, brands, topRated, bestSellers, customerReviews] =
    await Promise.all(
      results.map(async (r) => {
        if (r.status === "rejected" || !r.value.ok) return null;
        return r.value.json();
      })
    );

  return { heroBanner, topCategories, bannerOne, bannerTwo, trending, brands, topRated, bestSellers, customerReviews };
}

// Per-user data — must be no-store (session-dependent)
async function getUserHomepageData(allCookies: string) {
  const [personalized, recentlyViewed] = await Promise.allSettled([
    fetch(`${baseUrl}${API_ENDPOINTS.PRODUCTS.PERSONALIZED}`, {
      headers: { Cookie: allCookies },
      cache: "no-store",
    }),
    fetch(`${baseUrl}${API_ENDPOINTS.PRODUCTS.RECENTLY_VIEWED}`, {
      headers: { Cookie: allCookies },
      cache: "no-store",
    }),
  ]);

  const personalizedData = personalized.status === "fulfilled" && personalized.value.ok
    ? await personalized.value.json() : null;
  const recentlyViewedData = recentlyViewed.status === "fulfilled" && recentlyViewed.value.ok
    ? await recentlyViewed.value.json() : null;

  return { personalized: personalizedData, recentlyViewed: recentlyViewedData };
}

export async function getHomepageData() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");

  const [staticData, userData] = await Promise.all([
    getStaticHomepageData(),
    getUserHomepageData(allCookies),
  ]);

  const { heroBanner, topCategories, bannerOne, bannerTwo, trending, brands, topRated, bestSellers, customerReviews } = staticData;
  const { personalized, recentlyViewed } = userData;

  return {
    heroBanner,
    topCategories,
    bannerOne,
    bannerTwo,
    trendingDeals: trending?.products?.data ?? [],
    brands: brands?.data?.slice(0, 10) ?? [],
    topRated: topRated?.products?.data ?? [],
    bestSellers: bestSellers?.products?.data?.slice(0, 10) ?? [],
    personalized: personalized?.data?.slice(0, 10) ?? [],
    customerReviews: customerReviews?.config?.items ?? [],
    recentlyViewed: recentlyViewed ?? [],
  };
}
