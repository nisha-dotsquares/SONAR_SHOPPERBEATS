"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ui/ProductCard";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import { Product } from "@/types/product";
import { getPriceDetails } from "@/lib/utils/getPriceDetails";
import { getImageUrl } from "@/lib/utils/imageUtils";
import Loader from "../ui/loaders/Loader";
import { useIntersectionObserver } from "@/lib/hooks/useIntersectionObserver";

interface ProductDisplayProps {
  products: Product[];
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (limit: number) => void;
  sortBy: string;
  onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  categoryName?: string;
  isLoading?: boolean;
  infiniteScroll?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isFetchingMore?: boolean;
  hideSortAndPagination?: boolean;
}

const ProductDisplay: React.FC<ProductDisplayProps> = ({
  products,
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  sortBy,
  onSortChange,
  categoryName,
  isLoading = false,
  infiniteScroll = false,
  hasMore = false,
  onLoadMore,
  isFetchingMore = false,
  hideSortAndPagination = false,
}) => {
  const [view, setView] = useState("grid");
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useIntersectionObserver({
    target: loadMoreRef as React.RefObject<Element>,
    onIntersect: () => {
      if (infiniteScroll && hasMore && !isFetchingMore && onLoadMore) {
        onLoadMore();
      }
    },
    enabled: infiniteScroll && hasMore && !isFetchingMore,
    rootMargin: "100px",
  });

  if ((isLoading || isFetchingMore) && (!products || products.length === 0)) {
    return (
      <div className="product-right" style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Loader />
      </div>
    );
  }

  return (
    <div className="product-right">
      {!hideSortAndPagination && products && products.length > 0 && (
        <div className="product-search bg-white">
          <div className="dflex justify-between">
            <div className="product-bar">
              {/* <Button
                onClick={() => setView("list")}
                ... */}
            </div>

            <div className="product-sort">
              <span>Sort by:</span>
              <select onChange={onSortChange} value={sortBy}>
                <option value="">Select</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newly_added">Newly Added</option>
                <option value="top_rated">Highest rated</option>
                <option value="biggest_saving">Biggest saving</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {(!isLoading && !isFetchingMore && (!products || products.length === 0)) ? (
        <div className="dflex flex-column align-center w-100">
          <h4>No products found</h4>
        </div>
      ) : view === "grid" ? (
        <div className="grid-5">
          {products.map((product) => {
            const priceInfo = getPriceDetails(product);
            return (
              <ProductCard
                key={product.id}
                image={getImageUrl(product)}
                title={product.title}
                mainPrice={priceInfo.mainPrice}
                wasPrice={priceInfo.wasPrice}
                showWasPrice={priceInfo.showWasPrice}
                discountPercentage={priceInfo.discountPercentage}
                saveAmount={priceInfo.saveAmount}
                id={product.id}
                unique_code={product.unique_code}
                defaultVariantId={product.variants?.[0]?.id}
                variants={product.variants ?? []}
                promotion_name={product.promotion_name}
                stock={product.stock}
                tags={product.tags}
              />
            );
          })}
        </div>
      ) : (
        <div className="product-list">
          {products.map((product) => {
            const priceInfo = getPriceDetails(product);
            return (
              <Link
                href={{
                  pathname: `/product/${product.unique_code}`,
                  query: { category: categoryName },
                }}
                key={product.id}
              >
                <ProductCard
                  image={getImageUrl(product)}
                  title={product.title}
                  mainPrice={priceInfo.mainPrice}
                  wasPrice={priceInfo.wasPrice}
                  showWasPrice={priceInfo.showWasPrice}
                  discountPercentage={priceInfo.discountPercentage}
                  saveAmount={priceInfo.saveAmount}
                  id={product.id}
                  defaultVariantId={product.variants?.[0]?.id}
                  promotion_name={product.promotion_name}
                  stock={product.stock}
                  tags={product.tags}
                />
              </Link>
            );
          })}
        </div>
      )}
      {!hideSortAndPagination && products && products.length > 0 && (
        <div className="product-search bg-white mt-40">
          {/* Infinite Scroll Sentinel */}
          {infiniteScroll && hasMore && (
            <div
              className="dflex"
              ref={loadMoreRef}
              style={{
                marginTop: "20px",
                marginBottom: "20px",
                textAlign: "center",
                width: "100%",
                padding: "10px",
                minHeight: "40px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              {isFetchingMore ? (
                <div className="dflex align-center">
                  <span className="loader-spinner" style={{ marginRight: "10px", border: "2px solid #f3f3f3", borderTop: "2px solid #333", borderRadius: "50%", width: "16px", height: "16px", animation: "spin 1s linear infinite" }}></span>
                  <span style={{ fontWeight: "600", color: "#666" }}>Loading more products...</span>
                  <style jsx>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              ) : (
                <span style={{ opacity: 0 }}>Sentinel</span>
              )}
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={onItemsPerPageChange}
            totalItems={totalItems}
          />
        </div>
      )}
    </div>
  );
};

export default ProductDisplay;