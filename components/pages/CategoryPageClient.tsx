"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import {
  setBreadcrumbs,
  addBreadcrumb,
} from "@/lib/redux/slices/breadcrumbSlice";
import ReusableSlider from "@/components/ui/ReusableSlider";
import CategoryCard from "@/components/ui/CategoryCard";
import { useGetWishlistQuery } from "@/lib/redux/apis/cartApi";
import { useGetProductsQuery } from "@/lib/redux/apis/productsApi";
import { findCategoryPath } from "@/lib/utils/findCategoryPath";
import { Category, Filter, Product } from "@/types/product";
import Sidebar from "../productListing/Sidebar";
import { useProductFilters } from "@/lib/hooks/useProductFilters";
import ProductDisplay from "../productListing/ProductDisplay";
import "../../styles/Product.css";

interface CategoryPageClientProps {
  slug: string;
  category: Category;
  products: Product[];
  filters: Filter[];
  totalItems: number;
  megaMenuData: Category[];
}

const CategoryPageClient = ({
  slug,
  category,
  products,
  filters,
  totalItems,
  megaMenuData,
}: CategoryPageClientProps) => {
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
  const [isLoadingNewFilter, setIsLoadingNewFilter] = useState(false);

  useEffect(() => {
    if (
      searchParams.toString() !== initialParams.current ||
      fetchingPage !== initialFetchingPage.current
    ) {
      setHasChanged(true);
    }
  }, [searchParams, fetchingPage]);

  useEffect(() => {
    if (!megaMenuData?.length || !slug) return;
    const hierarchy = findCategoryPath(megaMenuData, slug);
    if (hierarchy) {
      dispatch(setBreadcrumbs(hierarchy));
    } else {
      dispatch(
        setBreadcrumbs([
          { name: category?.name || "Category", path: `/category/${slug}` },
        ])
      );
    }
  }, [slug, megaMenuData, category?.name, dispatch]);

  const { data, isLoading, error, isFetching } = useGetProductsQuery({
    ...Object.fromEntries(searchParams.entries()),
    category_slug: slug,
    page: fetchingPage,
    limit: CHUNK_SIZE,
  }, {
    skip: !slug || !hasChanged,
    refetchOnMountOrArgChange: true,
  });

  // Calculate effective total
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
      setAllProducts([]);
      setIsLoadingNewFilter(true);
      setHasMoreFromApi(true);
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
        // If we are on the very first page chunk of our grid, replace everything (e.g., sort changed or page 1)
        if (fetchingPage <= startFetching) {
          return currentProducts;
        }

        // Otherwise append for load more
        const newProducts = currentProducts.filter(p => !prev.some(existing => existing.id === p.id));
        return [...prev, ...newProducts];
      });
      setIsLoadingNewFilter(false);
    }
  }, [data, fetchingPage, currentPage, uiLimit]);

  // Reset on filter/sort change (params change)
  useEffect(() => {
    // Handled by sync
  }, []);


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
    // Only load more if we haven't filled the UI limit yet
    if (allProducts.length < uiLimit && allProducts.length < effectiveTotal && hasMoreFromApi && !isFetching) {
      setFetchingPage(prev => prev + 1);
    }
  };





  const sliderCategories = category?.subcategories?.map((sub: Category) => ({
    title: sub.name,
    image: sub.icon_url || "/images/image-coming-soon.jpg",
    slug: sub.slug ?? sub.id,
    product_count: sub.product_count,
  })) || [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: category?.name || slug,
            url: `/category/${slug}`,
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
        className="banner-bg"
        style={{ backgroundImage: `url(${category?.image_url || "/images/logo.svg"})` }}
      >
        <div className="content-inner">
          <h2 className="textwhite align-center">{category?.name || ""}</h2>
        </div>
      </div>

      {sliderCategories.length > 0 && (
        <div className="top-categories product-categories mt-40 mb-40">
          <div className="container">
            <div className="dflex justify-center title-wrapper">
              <h2>Shop By Category</h2>
            </div>
            <ReusableSlider
              items={sliderCategories}
              slidesToShow={6}
              slidesToScroll={1}
              gap={35}
              infinite={false}
              arrows
              pauseOnHover
              renderItem={(item) => (
                <CategoryCard
                  key={item.slug}
                  image={item.image}
                  title={item.title}
                  onClick={() =>
                    dispatch(
                      addBreadcrumb({
                        name: item.title,
                        path: `/category/${item.slug}`,
                      })
                    )
                  }
                  linkHref={`/category/${item.slug}?${searchParams.toString()}`}
                />
              )}
            />
          </div>
        </div>
      )}

      <div className="container mt-30">
        <div className="dflex mb-40">
          <Sidebar filters={persistedFilters} category={category} />

          <ProductDisplay
            products={allProducts}
            totalItems={effectiveTotal}
            itemsPerPage={uiLimit}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            categoryName={category?.name}
            // wishlistedProductIds={wishlistedProductIds}
            isLoading={isLoading || (isFetching && allProducts.length === 0) || isLoadingNewFilter}
            onLoadMore={handleLoadMore}
            infiniteScroll={true}
            hasMore={allProducts.length < uiLimit && allProducts.length < effectiveTotal && hasMoreFromApi}
            isFetchingMore={(isFetching && allProducts.length > 0) || isLoadingNewFilter}
          />
        </div>
      </div>
    </>
  );
};

export default CategoryPageClient;