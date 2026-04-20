

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { setBreadcrumbs } from "@/lib/redux/slices/breadcrumbSlice";
import { useGetProductsQuery } from "@/lib/redux/apis/productsApi";
import { Product } from "@/types/product";
import ProductDisplay from "../productListing/ProductDisplay";
import "../../styles/Product.css";

interface ProductsPageClientProps {
  products: Product[];
  totalItems: number;
}

const ProductsPageClient = ({
  products,
  totalItems,
}: ProductsPageClientProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );
  const [itemsPerPage, setItemsPerPage] = useState(
    Number(searchParams.get("limit") || 100)
  );

  useEffect(() => {
    dispatch(
      setBreadcrumbs([{ name: "Products", path: "/products" }])
    );
  }, [dispatch]);

  const initialParams = useRef(searchParams.toString());
  const initialPage = useRef(currentPage);
  const initialLimit = useRef(itemsPerPage);
  const [hasChanged, setHasChanged] = useState(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("limit");
    return params.toString().length > 0;
  });

  useEffect(() => {
    if (
      searchParams.toString() !== initialParams.current ||
      currentPage !== initialPage.current ||
      itemsPerPage !== initialLimit.current
    ) {
      setHasChanged(true);
    }
  }, [searchParams, currentPage, itemsPerPage]);

  const { data, isLoading, error } = useGetProductsQuery({
    page: currentPage,
    limit: itemsPerPage,
  }, {
    skip: !hasChanged,
    refetchOnMountOrArgChange: true,
  });
  const apiProducts = hasChanged
    ? (data ? (data.data || []) : [])
    : products;
  const effectiveTotal = hasChanged
    ? (data?.total || 0)
    : (data?.total ?? totalItems);
  const totalPages = Math.ceil(effectiveTotal / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);

      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", newItemsPerPage.toString());
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    setCurrentPage(Number(searchParams.get("page")) || 1);
    setItemsPerPage(Number(searchParams.get("limit")) || 100);
  }, [searchParams]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "All Products",
            url: "/products",
            numberOfItems: products.length,
            itemListElement: products.map((product, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: product.title,
              url: `/product/${product.unique_code || product.slug}`,
            })),
          }),
        }}
      />

      <div className="banner-bg">
        <div className="content-inner">
          <h2 className="textwhite align-center">All Products</h2>
        </div>
      </div>

      <div className="container">
        <div className="dflex mb-40 mt-40">
          <ProductDisplay
            products={apiProducts}
            totalItems={effectiveTotal}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            sortBy=""
            onSortChange={() => { }}
            isLoading={isLoading}
          />
        </div>
      </div>
    </>
  );
};

export default ProductsPageClient;