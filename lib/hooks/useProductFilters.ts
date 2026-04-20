"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Category, Filter } from "@/types/product";

export const useProductFilters = (
  filters: Filter[],
  category?: Category | null
) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [brandSearch, setBrandSearch] = useState("");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("categories")?.split(",").filter(Boolean) || []
  );
  const [selectedPrices, setSelectedPrices] = useState<string[]>(
    searchParams.get("price_ranges")?.split(",").filter(Boolean) || []
  );
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >(() => {
    const filtersFromUrl: Record<string, string[]> = {};
    const shippingValues: string[] = [];

    searchParams.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey === "fast_dispatch" && value === "true") {
        shippingValues.push("Fast Dispatch");
      } else if (lowerKey === "free_shipping" && value === "true") {
        shippingValues.push("Free Shipping");
      } else if (
        ![
          "min_price",
          "max_price",
          "sort_by",
          "categories",
          "price_ranges",
          "page",
          "limit",
          "q",
          "category_id",
          "category_slug",
          "fast_dispatch",
          "free_shipping",
          "shipping"
        ].includes(lowerKey)
      ) {
        filtersFromUrl[lowerKey] = value.split(",");
      }
    });

    if (shippingValues.length > 0) {
      filtersFromUrl["shipping"] = shippingValues;
    }

    return filtersFromUrl;
  });
  const [sortBy, setSortBy] = useState(searchParams.get("sort_by") || "");

  const isInitialMount = useRef(true);
  const isSyncingFromUrl = useRef(false);

  // Sync state with URL params when they change externally
  useEffect(() => {
    isSyncingFromUrl.current = true;
    setMinPrice(searchParams.get("min_price") || "");
    setMaxPrice(searchParams.get("max_price") || "");
    setSelectedCategories(searchParams.get("categories")?.split(",").filter(Boolean) || []);
    setSelectedPrices(searchParams.get("price_ranges")?.split(",").filter(Boolean) || []);
    setSortBy(searchParams.get("sort_by") || "");

    const filtersFromUrl: Record<string, string[]> = {};
    const shippingValues: string[] = [];

    searchParams.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey === "fast_dispatch" && value === "true") {
        shippingValues.push("Fast Dispatch");
      } else if (lowerKey === "free_shipping" && value === "true") {
        shippingValues.push("Free Shipping");
      } else if (
        ![
          "min_price",
          "max_price",
          "sort_by",
          "categories",
          "price_ranges",
          "page",
          "limit",
          "q",
          "category_id",
          "category_slug",
          "fast_dispatch",
          "free_shipping",
          "shipping"
        ].includes(lowerKey)
      ) {
        filtersFromUrl[lowerKey] = value.split(",");
      }
    });

    if (shippingValues.length > 0) {
      filtersFromUrl["shipping"] = shippingValues;
    }

    setSelectedFilters(filtersFromUrl);
    setTimeout(() => {
      isSyncingFromUrl.current = false;
    }, 0);
  }, [searchParams]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams();

    // Preserve non-filter params (like q, category_slug, etc.)
    searchParams.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (['q', 'category_slug', 'category_id'].includes(lowerKey)) {
        params.set(key, value);
      }
    });

    // Set sort
    if (sortBy) params.set("sort_by", sortBy);

    // Set price filters
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);

    // Set category filters
    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","));
    }

    // Set price range filters
    if (selectedPrices.length > 0) {
      params.set("price_ranges", selectedPrices.join(","));
    }

    // Set all other filters
    for (const attribute in selectedFilters) {
      const attrKey = attribute.toLowerCase();
      if (attrKey === "shipping") {
        const values = selectedFilters[attribute];
        if (values.includes("Fast Dispatch")) {
          params.set("fast_dispatch", "true");
        }
        if (values.includes("Free Shipping")) {
          params.set("free_shipping", "true");
        }
      } else if (selectedFilters[attribute].length > 0) {
        params.set(attrKey, selectedFilters[attribute].join(","));
      }
    }

    // Preserve limit
    const currentLimit = searchParams.get('limit');
    if (currentLimit) {
      params.set('limit', currentLimit);
    }

    // Reset to page 1
    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (isInitialMount.current || isSyncingFromUrl.current) {
      isInitialMount.current = false;
      return;
    }
    handleApplyFilters();
  }, [selectedCategories, selectedPrices, selectedFilters, sortBy, minPrice, maxPrice]);


  const handlePriceChange = (price: string) => {
    // Single-select: selecting a new range replaces the old one; selecting the same deselects
    setSelectedPrices((prev) =>
      prev.includes(price) ? [] : [price]
    );
  };

  const handleFilterChange = (attribute: string, value: string) => {
    const attrKey = attribute.toLowerCase();
    setSelectedFilters((prev) => {
      const currentValues = prev[attrKey] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      return { ...prev, [attrKey]: newValues };
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const handleCategoryChange = (categoryName: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const clearFilters = () => {
    setBrandSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedCategories([]);
    setSelectedPrices([]);
    setSelectedFilters({});
    setSortBy("");
  };

  const brandFilter = filters.find((f) => f.attribute === "Brand");
  const priceFilter = filters.find((f) => f.attribute === "Price");
  const categoryFilter = filters.find((f) => f.attribute === "Category");
  const otherFilters = filters.filter(
    (f) => f.attribute !== "Brand" && f.attribute !== "Price" && f.attribute !== "Category"
  );

  const flattenCategories = (categories: Category[]): Category[] => {
    return categories.flatMap(cat => [cat, ...(cat.subcategories ? flattenCategories(cat.subcategories) : [])]);
  };

  const allCategories = category?.subcategories
    ? flattenCategories(category.subcategories)
    : [];


  return {
    brandSearch,
    setBrandSearch,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    selectedCategories,
    setSelectedCategories: handleCategoryChange,
    selectedPrices,
    handlePriceChange,
    selectedFilters,
    handleFilterChange,
    sortBy,
    handleSortChange,
    handleApplyFilters,
    clearFilters,
    brandFilter,
    priceFilter,
    categoryFilter,
    otherFilters,
    allCategories,
  };
};

