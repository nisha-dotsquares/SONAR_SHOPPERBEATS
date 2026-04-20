

"use client";

import React from "react";
import ProductCarousel from "../ui/ProductCarousel";
import { getPriceDetails } from "@/lib/utils/getPriceDetails";
import { Product } from "@/types/product";
import { getImageUrl } from "@/lib/utils/imageUtils";

export default function Personalized({ personalized }: { personalized: Product[] }) {
  const transformedProducts = personalized.map((product) => {
    const priceInfo = getPriceDetails(product);

    return {
      ...product,
      mainPrice: priceInfo.mainPrice,
      wasPrice: priceInfo.wasPrice,
      tags: product.tags,
      showWasPrice: priceInfo.showWasPrice,
      discountPercentage: priceInfo.discountPercentage,
      saveAmount: priceInfo.saveAmount,
      image: getImageUrl(product),
      unique_code: product.unique_code || product.product_unique_code,
      promotion_name: product.promotion_name,
    };
  });

  return (
    <ProductCarousel
      title="Personalized Products"
      products={transformedProducts}
      link="/product-listing/personalized"
    />
  );
}
