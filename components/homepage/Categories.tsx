"use client";

import React from "react";
import ReusableSlider from "../ui/ReusableSlider";
import CategoryCard from "../ui/CategoryCard";
import { HomepageSection, TopCategoryItem } from "@/types/homepage";
import Link from "next/link";

interface CategoriesProps {
  topCategoriesSection: HomepageSection;
}

export default function Categories({ topCategoriesSection }: CategoriesProps) {
  if (!topCategoriesSection?.config || !('items' in topCategoriesSection.config) || !topCategoriesSection.config.items) {
    return null;
  }

  const categories = topCategoriesSection.config.items as TopCategoryItem[];

  return (
    <div className="top-categories mb-70">
      <div className="container">
        <div className="dflex justify-between mb-30 title-wrapper">
          <h2>Top Categories</h2>
          <Link href={`/all-categories`} className="btn btn-white">
            See All
          </Link>
        </div>

        <div className="categories-slider owl-carousel owl-theme">
          <ReusableSlider
            items={categories}
            slidesToShow={6}
            gap={35}
            slidesToScroll={5}
            speed={1700}
            autoplaySpeed={30}
            infinite={true}
            arrows={true}
            pauseOnHover={true}
            renderItem={(category, index) => (
              <CategoryCard
                linkHref={`category/${category.slug}`}
                key={category.slug}
                image={category.image}
                title={category.title}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
