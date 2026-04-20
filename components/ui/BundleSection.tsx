"use client";

import React, { useState } from "react";
import { BundleProduct } from "@/types/product";
import { useAddToCartMutation } from "@/lib/redux/apis/cartApi";
import { toast } from "react-toastify";
import ProductCard from "./ProductCard";
import Button from "./Button";
import "../../styles/BundleSection.css";
import { formatPrice } from "@/lib/utils/formatPrice";

interface BundleSectionProps {
  bundleProducts: BundleProduct[];
}

export default function BundleSection({ bundleProducts }: BundleSectionProps) {
  const [addToCart, { isLoading }] = useAddToCartMutation();
  const getItemKey = (product: BundleProduct) =>
    `${product.product_id}-${product.variant_id || 'default'}`;

  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
    bundleProducts.reduce((acc, product) => {
      acc[getItemKey(product)] = true;
      return acc;
    }, {} as Record<string, boolean>)
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(
    bundleProducts.reduce((acc, product) => {
      acc[getItemKey(product)] = 1;
      return acc;
    }, {} as Record<string, number>)
  );

  const handleItemToggle = (itemKey: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  const handleQuantityChange = (itemKey: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemKey]: quantity
    }));
  };

  const handleAddBundleToCart = async () => {
    try {
      const body = {
        items: bundleProducts
          .filter(product => selectedItems[getItemKey(product)])
          .map(product => ({
            product_id: product.product_id,
            quantity: quantities[getItemKey(product)] || 1,
            ...(product.variant_id && { variant_id: product.variant_id })
          }))
      };

      await addToCart(body).unwrap();
      toast.success("Bundle added to cart!");
    } catch {
      toast.error("Failed to add bundle to cart");
    }
  };

  const totalPrice = bundleProducts
    .filter(product => selectedItems[getItemKey(product)])
    .reduce((total, product) => {
      return total + (product.price * (quantities[getItemKey(product)] || 1));
    }, 0);

  return (
    <div className="bundle-section pt-70">
      <div className="container">
        <h4 className="mb-30">Frequently bought together</h4>

        <div className="bundle-items dflex align-center gap-20 mb-30">
          {bundleProducts.map((product, index) => {
            const itemKey = getItemKey(product);
            return (
              <React.Fragment key={itemKey}>
                <div className="bundle-item">
                  <div className="bundle-checkbox">
                    <input
                      type="checkbox"
                      id={`checkbox-${itemKey}`}
                      checked={selectedItems[itemKey] || false}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleItemToggle(itemKey);
                      }}
                    />
                  </div>
                  <ProductCard
                    id={product.product_id}
                    title={product.title}
                    mainPrice={product.price}
                    wasPrice={product.rrp_price}
                    showWasPrice={product.rrp_price > product.price}
                    image={product.images?.[0]?.image_url || "/images/image-coming-soon.jpg"}
                    defaultVariantId={product.variant_id}
                    tags={product.tags}
                  />

                </div>


                {index < bundleProducts.length - 1 && (
                  <div className="bundle-plus">
                    <span className="plus-icon">+</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}

          <div className="bundle-add-to-cart">
            <Button
              onClick={handleAddBundleToCart}
              disabled={isLoading}
              className="btn btn-red btn-filled btn-sharp"
              debounceDelay={500}
            >
              {isLoading ? "Adding..." : "Add Bundle to Cart"}
            </Button>
            <div className="bundle-total-price">
              <h4>Total: ${formatPrice(totalPrice)}</h4>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}