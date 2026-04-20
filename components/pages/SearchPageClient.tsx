

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { setBreadcrumbs } from "@/lib/redux/slices/breadcrumbSlice";
import { useGetProductsQuery } from "@/lib/redux/apis/productsApi";
import { Product, Filter } from "@/types/product";
import Sidebar from "../productListing/Sidebar";
import { useProductFilters } from "@/lib/hooks/useProductFilters";
import ProductDisplay from "../productListing/ProductDisplay";


interface SearchPageClientProps {
  query: string;
  products: Product[];
  filters: Filter[];
  totalItems: number;
}

const SearchPageClient = ({
  query,
  products,
  filters,
  totalItems,
}: SearchPageClientProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const [persistedFilters, setPersistedFilters] = useState<Filter[]>(filters);
  const prevQueryRef = useRef(query);

  useEffect(() => {
    if (query !== prevQueryRef.current) {
      setPersistedFilters(filters);
      prevQueryRef.current = query;
    } else if (filters && filters.length > 0) {
      setPersistedFilters(prev => filters.length > prev.length ? filters : prev);
    }
  }, [filters, query]);

  // Reset breadcrumb whenever the search page mounts or the query changes
  useEffect(() => {
    dispatch(
      setBreadcrumbs([{ name: `Search: "${query}"`, path: `/search?q=${encodeURIComponent(query)}` }])
    );
  }, [query, dispatch]);

  const { sortBy, handleSortChange } = useProductFilters(persistedFilters);

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
  const [hasMoreFromApi, setHasMoreFromApi] = useState(true);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    if (
      searchParams.toString() !== initialParams.current ||
      fetchingPage !== initialFetchingPage.current
    ) {
      setHasChanged(true);
    }
  }, [searchParams, fetchingPage]);

  const searchParamsObj = Object.fromEntries(searchParams.entries());
  delete searchParamsObj.q;

  const { data, isLoading, error, isFetching } = useGetProductsQuery({
    ...searchParamsObj,
    name: query,
    page: fetchingPage,
    limit: CHUNK_SIZE,
  }, {
    skip: !query || !hasChanged,
    refetchOnMountOrArgChange: true,
  });

  const effectiveTotal = data?.total ?? totalItems;



  // Sync with URL params
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
      setFetchingPage(calculateStartFetchingPage(1, limit));
    } else if (page !== currentPage || limit !== uiLimit) {
      if (page === currentPage && limit > uiLimit) {
        setUiLimit(limit);
      } else {
        setCurrentPage(page);
        setUiLimit(limit);
        setFetchingPage(calculateStartFetchingPage(page, limit));
      }
    }
  }, [searchParams, currentPage, uiLimit, currentFilterString]);

  useEffect(() => {
    if (data) {
      const currentProducts = data.data || [];
      const startFetching = calculateStartFetchingPage(currentPage, uiLimit);

      setHasMoreFromApi(currentProducts.length >= CHUNK_SIZE);

      setAllProducts(prev => {
        if (fetchingPage <= startFetching) {
          return currentProducts;
        }

        const newProducts = currentProducts.filter(p => !prev.some(existing => existing.id === p.id));
        return [...prev, ...newProducts];
      });
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
    if (allProducts.length < uiLimit && allProducts.length < effectiveTotal && hasMoreFromApi && !isFetching) {
      setFetchingPage(prev => prev + 1);
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
            name: `Search results for "${query}"`,
            url: `/search?q=${query}`,
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
          <h2 className="textwhite align-center">{`Search results for "${query}"`}</h2>
        </div>
      </div>

      <div className="container pt-40">
        <div className="dflex mb-40">
          <Sidebar filters={persistedFilters} />

          <ProductDisplay
            products={allProducts}
            totalItems={effectiveTotal}
            itemsPerPage={uiLimit}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            isLoading={isLoading || (isFetching && allProducts.length === 0)}
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

export default SearchPageClient;