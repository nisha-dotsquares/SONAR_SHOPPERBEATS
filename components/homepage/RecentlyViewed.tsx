"use client";

import React from "react";
import ProductCarousel from "../ui/ProductCarousel";
import { Product } from "@/types/product";
import { getPriceDetails } from "@/lib/utils/getPriceDetails";
import { getImageUrl } from "@/lib/utils/imageUtils";

export default function RecentlyViewed({
  recentlyViewed,
  from,
}: {
  recentlyViewed: Product[] | null;
  from?: string;
}) {
  if (!recentlyViewed || recentlyViewed.length === 0) {
    return null;
  }

  const transformedProducts = recentlyViewed.map((product) => {
    const priceInfo = getPriceDetails(product);

    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      unique_code: product.unique_code,
      tags: product.tags,

      brand_name: product.brand_name,
      brand_slug: product.brand_slug,

      category_name: product.category_name,
      category_slug: product.category_slug,

      image: getImageUrl(product), // resolves main image from images[]

      mainPrice: priceInfo.mainPrice,
      wasPrice: priceInfo.wasPrice,
      showWasPrice: priceInfo.showWasPrice,
      discountPercentage: priceInfo.discountPercentage,
      saveAmount: priceInfo.saveAmount,

      free_shipping: product.free_shipping,
      fast_dispatch: product.fast_dispatch,

      promotion_name: product.promotion_name ?? null,
      rating: product.review_stats?.average_rating ?? undefined,
      reviewsCount: product.reviews?.length ?? 0,
    };
  });

  return (
    <ProductCarousel
      title="Recently Viewed"
      products={transformedProducts}
      link="/product-listing/recently-viewed"
      from={from}
    />
  );
}