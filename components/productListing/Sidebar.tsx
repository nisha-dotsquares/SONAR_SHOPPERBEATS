"use client";

import React from "react";
import Link from "next/link";
import Accordion from "@/components/ui/Accordion";
import { useProductFilters } from "@/lib/hooks/useProductFilters";
import { Category, Filter } from "@/types/product";
import Button from "@/components/ui/Button";
import { useParams } from "next/navigation";

interface SidebarProps {
  filters: Filter[];
  category?: Category | null;
}

const Sidebar: React.FC<SidebarProps> = ({ filters, category }) => {
  const {
    brandSearch,
    setBrandSearch,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    selectedCategories,
    setSelectedCategories,
    selectedPrices,
    handlePriceChange,
    selectedFilters,
    handleFilterChange,
    handleApplyFilters,
    clearFilters,
    brandFilter,
    priceFilter,
    categoryFilter,
    otherFilters,
    allCategories,
  } = useProductFilters(filters, category);
  const params = useParams();
  const activeSlug = params?.slug;

  const formatPrice = (price: string) => {
  return price.replace(/\d+(\.\d+)?/g, (match: string, _: string, offset: number) => {
    // check if inside parentheses
    const before = price.slice(0, offset);
    const open = before.lastIndexOf("(");
    const close = before.lastIndexOf(")");
    
    if (open > close) {
      return match; // inside ()
    }
    return `$${match}`;
  });
};

  const renderNestedCategories = (categories: Category[], depth = 0) => (
    <ul className={`category-listing ${depth > 0 ? "ml-14" : "mt-18"}`}>
      {categories.map((cat) => {
        const isActive = activeSlug === cat.slug;

        return (
          <li key={cat.id || cat.slug} className="flex-col align-start">
            <Link
              href={`/category/${cat.slug}`}
              className={`category-link ${isActive ? "active-category" : ""}`}
              style={{
                color: "var(--black)",
                textDecoration: "none",
                display: "block",
                width: "100%",
              }}
            >
              {cat.name}
            </Link>

            {cat.subcategories &&
              cat.subcategories.length > 0 &&
              renderNestedCategories(cat.subcategories, depth + 1)}
          </li>
        );
      })}
    </ul>
  );

  // const renderCategories = (categories: Category[]) => (
  //   <ul className="category-listing mt-18">
  //     {categories.map((cat) => (
  //       <li key={cat.id}>
  //         <input
  //           type="checkbox"
  //           id={`cat-${cat.id}`}
  //           checked={selectedCategories.includes(cat.name)}
  //           onChange={() => setSelectedCategories(cat.name)}
  //         />
  //         <label htmlFor={`cat-${cat.id}`}>{cat.name} ({cat.product_count})</label>
  //       </li>
  //     ))}
  //   </ul>
  // );

  const accordionItems = [
    ...(categoryFilter?.values?.length
      ? [
        {
          id: "categories",
          title: "Categories",
          content: renderNestedCategories(categoryFilter.values as never as Category[]),
        },
      ]
      : []),
    ...(priceFilter?.values?.length
      ? [
        {
          id: "price",
          title: "Filter By Price",
          content: (
            <div className="mt-18">
              <div className="price-filter dflex align-center gap-2 mb-2">
                <span>$</span>
                <input
                  type="number"
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="price-input"
                />
                <span className="filter-space">To</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="price-input"
                />
                <Button onClick={handleApplyFilters} className="apply-btn cursor-pointer">
                  Apply
                </Button>
              </div>

              <ul className="price-list">
                {priceFilter.values.map((price, idx) => {
                  const normalizedPrice = price.replace(/\(\d+\)/, "").trim();
                  return (
                    <li key={idx}>
                      <input
                        type="checkbox"
                        name="price_range"
                        id={`price-${idx}`}
                        checked={selectedPrices.some(p => p.replace(/\s*\(\d+\)\s*$/, "").trim() === normalizedPrice)}
                        onChange={() => handlePriceChange(normalizedPrice)}
                      />
                      <label htmlFor={`price-${idx}`}>
                      {formatPrice(price)}
                    </label>
                                        </li>
                  );
                })}
              </ul>
            </div>
          ),
          defaultOpen: selectedPrices.length > 0 || minPrice !== "" || maxPrice !== "",
        },
      ]
      : []),

    ...(brandFilter
      ? [
        {
          id: "brand",
          title: "Brand",
          content: (
            <div className="mt-18">
              <input
                type="search"
                placeholder="Search for a brand"
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="brand-search"
              />
              <ul className="brands-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {(brandFilter.values || [])
                  .filter((brand) =>
                    brand.toLowerCase().includes(brandSearch.toLowerCase())
                  )
                  .map((brand, idx) => (
                    <li key={idx}>
                      <input
                        type="checkbox"
                        id={`brand-${idx}`}
                        checked={selectedFilters["brand"]?.includes(brand) || false}
                        onChange={() => handleFilterChange("Brand", brand)}
                      />
                      <label htmlFor={`brand-${idx}`}>{brand}</label>
                    </li>
                  ))}
              </ul>
            </div>
          ),
          defaultOpen: (selectedFilters["brand"]?.length || 0) > 0 || brandSearch !== "",
        },
      ]
      : []),
    ...otherFilters.map((filter) => ({
      title: filter.attribute,
      id: `filter-${filter.attribute}`,
      content: (
        <div className="mt-18">
          <ul className="filter-list">
            {filter.values.map((value: string, idx: number) => (
              <li key={idx}>
                <input
                  type="checkbox"
                  id={`filter-${filter.attribute}-${idx}`}
                  checked={
                    selectedFilters[filter.attribute.toLowerCase()]?.includes(value) || false
                  }
                  onChange={() => handleFilterChange(filter.attribute, value)}
                />
                <label htmlFor={`filter-${filter.attribute}-${idx}`}>{value}</label>
              </li>
            ))}
          </ul>
        </div>
      ),
      defaultOpen: (selectedFilters[filter.attribute.toLowerCase()]?.length || 0) > 0,
    })),
  ];

  const hasActiveFilters = 
    Object.values(selectedFilters).some(arr => arr.length > 0) || 
    selectedPrices.length > 0 || 
    selectedCategories.length > 0 || 
    minPrice !== "" || 
    maxPrice !== "";

  return (
    <div className="sidebar">
      {hasActiveFilters && (
        <div className="clear-filter">
          <Button 
            onClick={clearFilters} 
            className="clear-btn"
          >
            Clear Filters
          </Button>
        </div>
      )}
      <Accordion items={accordionItems} />
    </div>
  );
};

export default Sidebar;