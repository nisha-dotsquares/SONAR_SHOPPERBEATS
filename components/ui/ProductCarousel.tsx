"use client";

import React from "react";
import ReusableSlider from "./ReusableSlider";
import ProductCard from "./ProductCard";
import { Product, BundleProduct } from "@/types/product";
import Link from "next/link";

interface ProductCarouselProps {
  title: string;
  products?: Product[];
  bundleProducts?: BundleProduct[];
  from?: string;
  link?: string;
}

export default function ProductCarousel({
  title,
  products,
  bundleProducts,
  from,
  link
}: ProductCarouselProps) {
  const items = (bundleProducts || products || []) as (Product | BundleProduct)[];

  return (
    <div className={from == "details" ? "products" : "products mb-70"}>
      <div className="container">
        <div className="dflex justify-between mb-30 title-wrapper">
          <h2>{title}</h2>
          {from !== "details" && (
            <a href={link} className="btn btn-white">
              See All
            </a>
          )}
        </div>

        <div className="products-slider">
          <ReusableSlider<Product | BundleProduct>
            items={items}
            slidesToShow={5}
            slidesToScroll={3}
            gap={15}
            speed={600}
            infinite={false}
            autoplaySpeed={0}
            arrows={true}
            renderItem={(item, index) => {
              if (bundleProducts) {
                console.log("Rendering bundle product:", bundleProducts,item);
                const bundleItem = item as BundleProduct;
                console.log("Rendering bundle product:", bundleItem);
                return (
                  <div className="product-card-link" key={bundleItem.product_id || bundleItem.unique_code}>
                    <ProductCard
                      id={bundleItem.product_id}
                      title={bundleItem.title}
                      mainPrice={bundleItem.price}
                      wasPrice={bundleItem.rrp_price}
                      showWasPrice={bundleItem.rrp_price > bundleItem.price}
                      image={bundleItem.images?.[0]?.image_url || "/images/image-coming-soon.jpg"}
                      unique_code={bundleItem.unique_code}
                      defaultVariantId={bundleItem.variant_id}
                      promotion_name={bundleItem.promotion_name}
                      tags={bundleItem.tags}
                    />
                  </div>
                );
              } else {
                const product = item as Product;
                return (
                  <div className="product-card-link" key={product.id || product.unique_code}>
                    <ProductCard
                      {...product}
                      image={product.image || "/images/image-coming-soon.jpg"}
                      id={product.id || product.product_unique_code}
                      unique_code={product.unique_code || product.product_unique_code}
                      defaultVariantId={product.variants?.[0]?.id || product.variant_id}
                    />
                  </div>
                );
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
