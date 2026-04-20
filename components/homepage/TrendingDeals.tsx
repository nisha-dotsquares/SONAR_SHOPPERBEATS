

"use client";

import React from "react";
import ProductCarousel from "../ui/ProductCarousel";
import TopDeals from "./DealBlock";
import { Product } from "@/types/product";
import { transformProductData } from "@/lib/utils/transformProductData";

export default function TrendingDeals({ trendingDeals }: { trendingDeals: Product[] }) {
  const transformedProducts = transformProductData(trendingDeals);

  return (
    <>
      <ProductCarousel title="Trending Deals" products={transformedProducts} link="/product-listing/trending-deals" />
    </>
  );
}
