"use client";

import Link from "next/link";
import React from "react";

interface CategoryCardProps {
  image: string;
  title: string;
  onClick?: () => void;
  linkHref?: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  image,
  title,
  onClick,
  linkHref,
}) => {
  return (
    <Link href={linkHref || "#"}>
      <div
        className="item"
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="categories-img">
          <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div className="categories-title">
          <h5 className="align-center">{title}</h5>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
