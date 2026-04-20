"use client";

import { useEffect } from "react";
import ProductDetailClient from "@/components/pages/ProductDetailClient";
import { useSEO } from "@/contexts/SEOContext";
import { getImageUrl } from "@/lib/utils/imageUtils";
import { Product, Category } from "@/types/product";

export interface SeoData {
  meta_description?: string;
  page_title?: string;
  meta_keywords?: string;
  canonical_url?: string;
}

interface ProductDetailWrapperProps {
  product: Product;
  seo?: SeoData;
  recommendations: Product[] | null;
  popularProducts: Product[] | null;
  megaMenuData: Category[];
  slug: string;
}

export default function ProductDetailWrapper({
  product,
  seo,
  recommendations,
  popularProducts,
  megaMenuData,
  slug
}: ProductDetailWrapperProps) {
  const { updateMetadata } = useSEO();

  useEffect(() => {
    const mainImage = getImageUrl(product);
    const cleanDescription = seo?.meta_description?.replace(/<[^>]*>/g, '').substring(0, 160) ||
      product.description?.replace(/<[^>]*>/g, '').substring(0, 160);

    updateMetadata({
      title: seo?.page_title || product.title,
      description: cleanDescription,
      keywords: seo?.meta_keywords,
      canonical_url: seo?.canonical_url,
      og_title: seo?.page_title || product.title,
      og_image: [mainImage],
      twitter_cards_title: seo?.page_title || product.title,
      twitter_cards_type: "summary_large_image",
    });
  }, [product, seo, updateMetadata]);

  return (
    <ProductDetailClient
      product={product}
      recommendations={recommendations}
      popularProducts={popularProducts}
      megaMenuData={megaMenuData}
      slug={slug}
    />
  );
}