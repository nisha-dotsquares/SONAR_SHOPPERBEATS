"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import {
  setBreadcrumbs,
} from "@/lib/redux/slices/breadcrumbSlice";
import { useGetWishlistQuery } from "@/lib/redux/apis/cartApi";
import { findCategoryPath } from "@/lib/utils/findCategoryPath";
import { Category, Filter, Product } from "@/types/product";
import Sidebar from "../productListing/Sidebar";
import { useProductFilters } from "@/lib/hooks/useProductFilters";
import ProductDisplay from "../productListing/ProductDisplay";
import "../../styles/Product.css";
interface ProductListingClientProps {
  slug: string;
  category: Category | null;
  products: Product[];
  filters: Filter[];
  totalItems: number;
  megaMenuData: Category[];
  bannerImage?: string | null;
}

const ProductListingClient = ({
  slug,
  category,
  products,
  filters,
  totalItems,
  megaMenuData,
  bannerImage,
}: ProductListingClientProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { data: wishlistData } = useGetWishlistQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const wishlistedProductIds = wishlistData?.items?.map(item => item.product_id) || [];
  const wishlistedVariantIds = wishlistData?.items?.map(item => item.variant_id) || [];

  const isHighlight = [
    "best-sellers",
    "top-rated",
    "trending-deals",
    "clearance",
    "new-releases",
    "hot-deals",
    "popular",
    "today-s-deal",
    "whats-on-sale",
  ].includes(slug);

  const [persistedFilters, setPersistedFilters] = useState<Filter[]>(filters);
  const prevSlugRef = useRef(slug);

  useEffect(() => {
    if (slug !== prevSlugRef.current) {
      setPersistedFilters(filters);
      prevSlugRef.current = slug;
    } else if (filters && filters.length > 0) {
      setPersistedFilters(prev => filters.length > prev.length ? filters : prev);
    }
  }, [filters, slug]);

  const { sortBy, handleSortChange } = useProductFilters(persistedFilters, category);

  const CHUNK_SIZE = 20;

  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );

  const [uiLimit, setUiLimit] = useState(
    Number(searchParams.get("limit") || 100)
  );

  const [renderingLimit, setRenderingLimit] = useState(CHUNK_SIZE);

  useEffect(() => {
    if (!megaMenuData?.length || !slug) return;

    const hierarchy = findCategoryPath(megaMenuData, slug);

    if (hierarchy) {
      dispatch(setBreadcrumbs(hierarchy));
    } else {
      dispatch(
        setBreadcrumbs([
          {
            name: category?.name || slug,
            path: `/product-listing/${slug}`,
          },
        ])
      );
    }
  }, [slug, megaMenuData, category?.name, dispatch]);

  const apiProducts = products;
  const effectiveTotal = totalItems;
  // const totalPages = Math.ceil(effectiveTotal / itemsPerPage); // Not needed with infinite scroll simulation style

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleItemsPerPageChange = (newUiLimit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", newUiLimit.toString());
    const newPage = Math.max(1, Math.ceil(((currentPage - 1) * uiLimit + 1) / newUiLimit));
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const currentParams = new URLSearchParams(searchParams.toString());
  currentParams.delete("page");
  currentParams.delete("limit");
  const currentFilterString = currentParams.toString();
  const prevFilterStringRef = useRef(currentFilterString);

  useEffect(() => {
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 100;

    if (currentFilterString !== prevFilterStringRef.current) {
      prevFilterStringRef.current = currentFilterString;
      setCurrentPage(1);
      setUiLimit(limit);
      setRenderingLimit(CHUNK_SIZE);
    } else if (page !== currentPage || limit !== uiLimit) {
      if (page === currentPage && limit > uiLimit) {
        setUiLimit(limit);
      } else {
        setCurrentPage(page);
        setUiLimit(limit);
        setRenderingLimit(CHUNK_SIZE);
      }
    }
  }, [searchParams, currentPage, uiLimit, currentFilterString]);

  const handleLoadMore = () => {
    // Increase rendering limit
    if (renderingLimit < uiLimit && renderingLimit < apiProducts.length) {
      setRenderingLimit(prev => Math.min(prev + CHUNK_SIZE, uiLimit, apiProducts.length));
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: category?.name || slug,
            url: `/product-listing/${slug}`,
            numberOfItems: products.length,
            itemListElement: products.map((product, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: product.title,
              url: `/product/${product.slug}`,
            })),
          }),
        }}
      />

      <div
        className="banner-bg"
        style={
          bannerImage
            ? {
              backgroundImage: `url(${bannerImage})`,
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
            }
            : {}
        }
      >
        <div className="content-inner">
          {!isHighlight && <h2 className="textwhite align-center">{category?.name || ""}</h2>}
        </div>
      </div>

      <div className="container">
        <div className="dflex mb-40 mt-40">
          {persistedFilters.length > 0 && (
            <Sidebar filters={persistedFilters} category={category} />
          )}

          <ProductDisplay
            products={apiProducts.slice(0, renderingLimit)}
            totalItems={effectiveTotal}
            itemsPerPage={uiLimit}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            categoryName={category?.name}
            isLoading={false}
            onLoadMore={handleLoadMore}
            infiniteScroll={true}
            hasMore={renderingLimit < uiLimit && renderingLimit < apiProducts.length}
            isFetchingMore={false} // Client side, instant
            hideSortAndPagination={slug === "personalized" || slug === "recently-viewed"}
          />
        </div>
      </div>
    </>
  );
};

export default ProductListingClient;