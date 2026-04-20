

"use client";

import React from "react";
import ProductCarousel from "../ui/ProductCarousel";
import { Product } from "@/types/product";
import { transformProductData } from "@/lib/utils/transformProductData";

export default function BestSellers({ bestSellers }: { bestSellers: Product[] }) {
  const transformedProducts = transformProductData(bestSellers);
  return <ProductCarousel title="Bestsellers" products={transformedProducts} link="/product-listing/best-sellers"/>;
}
