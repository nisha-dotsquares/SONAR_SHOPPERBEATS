
// @ts-nocheck

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { setBreadcrumbs } from "@/lib/redux/slices/breadcrumbSlice";
import { useGetWishlistQuery } from "@/lib/redux/apis/cartApi";
import { useGetProductsQuery } from "@/lib/redux/apis/productsApi";
import { Filter, Product } from "@/types/product";
import Sidebar from "../productListing/Sidebar";
import { useProductFilters } from "@/lib/hooks/useProductFilters";
import ProductDisplay from "../productListing/ProductDisplay";
import "../../styles/Product.css";

interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  image_url: string | null;
  is_active: boolean;
  total_products: number;
  active_products: number;
  inactive_products: number;
}

interface BrandPageClientProps {
  brandId: string;
  brand: Brand;
  products: Product[];
  filters: Filter[];
  totalItems: number;
}

const BrandPageClient = ({
  brandId,
  brand,
  products,
  filters,
  totalItems,
}: BrandPageClientProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const { data: wishlistData } = useGetWishlistQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const wishlistedProductIds = wishlistData?.items?.map(item => item.product_id) || [];
  const wishlistedVariantIds = wishlistData?.items?.map(item => item.variant_id) || [];

  const [persistedFilters, setPersistedFilters] = useState<Filter[]>(filters);
  const prevBrandIdRef = useRef(brandId);

  useEffect(() => {
    if (brandId !== prevBrandIdRef.current) {
      setPersistedFilters(filters);
      prevBrandIdRef.current = brandId;
    } else if (filters && filters.length > 0) {
      setPersistedFilters(prev => filters.length > prev.length ? filters : prev);
    }
  }, [filters, brandId]);

  const { sortBy, handleSortChange } = useProductFilters(persistedFilters, brand);

  useEffect(() => {
    if (brand) {
      dispatch(setBreadcrumbs([{ name: brand.name, path: `/brand/${brandId}` }]));
    }
  }, [brand, brandId, dispatch]);

  const CHUNK_SIZE = 20;

  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );

  const [uiLimit, setUiLimit] = useState(
    Number(searchParams.get("limit") || 100)
  );

  const calculateStartFetchingPage = (uiPage: number, limit: number) => {
    const offset = (uiPage - 1) * limit;
    return Math.floor(offset / CHUNK_SIZE) + 1;
  };

  const [fetchingPage, setFetchingPage] = useState(
    calculateStartFetchingPage(Number(searchParams.get("page")) || 1, Number(searchParams.get("limit") || 100))
  );

  const [allProducts, setAllProducts] = useState<Product[]>(products);
  const initialParams = useRef(searchParams.toString());
  const initialFetchingPage = useRef(fetchingPage);
  const [hasChanged, setHasChanged] = useState(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("limit");
    return params.toString().length > 0;
  });
  const [hasMoreFromApi, setHasMoreFromApi] = useState(true);

  useEffect(() => {
    if (
      searchParams.toString() !== initialParams.current ||
      fetchingPage !== initialFetchingPage.current
    ) {
      setHasChanged(true);
    }
  }, [searchParams, fetchingPage]);

  const { data, isLoading, error, isFetching } = useGetProductsQuery({
    ...Object.fromEntries(searchParams.entries()),
    brand_slug: brandId,
    page: fetchingPage,
    limit: CHUNK_SIZE,
  }, {
    skip: !brandId || !hasChanged,
    refetchOnMountOrArgChange: true,
  });

  const effectiveTotal = data?.total ?? totalItems;

  useEffect(() => {
    // keeping old products while fetching new data
  }, [isFetching, data]);

  useEffect(() => {
    if (data) {
      const currentProducts = data.data || [];
      const startFetching = calculateStartFetchingPage(currentPage, uiLimit);

      // If API returned fewer than a full chunk, we've exhausted available products
      setHasMoreFromApi(currentProducts.length >= CHUNK_SIZE);

      if (fetchingPage === startFetching) {
        setAllProducts(currentProducts);
      } else if (fetchingPage > startFetching) {
        setAllProducts(prev => {
          const newProducts = currentProducts.filter(p => !prev.some(existing => existing.id === p.id));
          return [...prev, ...newProducts];
        });
      }
    }
  }, [data, fetchingPage, currentPage, uiLimit]);


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

  const handleLoadMore = () => {
    if (allProducts.length < uiLimit && allProducts.length < effectiveTotal && !isFetching) {
      setFetchingPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 100;

    if (page !== currentPage || limit !== uiLimit) {
      if (page === currentPage && limit > uiLimit) {
        setUiLimit(limit);
      } else {
        setCurrentPage(page);
        setUiLimit(limit);
        setFetchingPage(calculateStartFetchingPage(page, limit));
      }
    }
  }, [searchParams, currentPage, uiLimit]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: brand?.name || brandId,
            url: `/brand/${brandId}`,
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

      <div
        className="banner-bg mb-40"
        style={brand?.image_url ? { backgroundImage: `url(${brand.image_url})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      >
        <div className="content-inner">
          <h2 className="textwhite align-center">{brand?.name || ""}</h2>
        </div>
      </div>

      <div className="container">
        <div className="dflex mb-40">
          <Sidebar filters={persistedFilters} category={brand} />

          <ProductDisplay
            products={allProducts}
            totalItems={effectiveTotal}
            itemsPerPage={uiLimit}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            categoryName={brand?.name}
            isLoading={isLoading && allProducts.length === 0}
            onLoadMore={handleLoadMore}
            infiniteScroll={true}
            hasMore={allProducts.length < uiLimit && allProducts.length < effectiveTotal && hasMoreFromApi}
            isFetchingMore={isFetching && allProducts.length > 0}
          />
        </div>
      </div>
    </>
  );
};

export default BrandPageClient;