

"use client";

import React from "react";
import ProductCarousel from "../ui/ProductCarousel";
import { Product } from "@/types/product";
import { transformProductData } from "@/lib/utils/transformProductData";

export default function TopRated({ topRated }: { topRated: Product[] }) {
  const transformedProducts = transformProductData(topRated);
  return <ProductCarousel title="Top Rated" products={transformedProducts} link="/product-listing/top-rated" />;
}
