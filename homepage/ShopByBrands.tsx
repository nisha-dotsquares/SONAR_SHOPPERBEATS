

"use client";

import React from "react";
import ReusableSlider from "../ui/ReusableSlider";
import { Brand } from "@/types/product";
import Link from "next/link";



const BrandBlock: React.FC<Brand> = ({ image_url, logo_url, name, slug }) => {
  const defaultBgImage = "/images/image-coming-soon.jpg"; // Fallback image
  const defaultLogo = "/images/image-coming-soon.jpg"; // Fallback image

  return (
    < Link href={`/brand/${slug}`}>
      <div className="brand-block">
        <div className="brands-bg">
          <img src={image_url || defaultBgImage} alt={`${name} Background`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div className="brand-logo">
          <img src={logo_url || defaultLogo} alt={`${name} Logo`} style={{ width: '100%', height: 'auto', maxWidth: '70px', objectFit: 'contain' }} />
        </div>
      </div>
    </Link>
  );
};

export default function ShopByBrands({ brands }: { brands: Brand[] }) {
  return (
    <div className="brands mb-70">
      <div className="container">
        <div className="dflex justify-between mb-30 title-wrapper">
          <h2>Shop By Brands</h2>
          <a href="/brand" className="btn btn-white">
            See All
          </a>
        </div>

        <ReusableSlider
          items={brands}
          slidesToShow={5}
          gap={20}
          slidesToScroll={1}
          infinite={false}
          arrows={true}
          speed={800}
          pauseOnHover={true}
          renderItem={(brand, index) => (
            <BrandBlock
              key={brand.id || index}
              id={brand.id}
              slug={brand.slug}
              name={brand.name}
              image_url={brand.image_url}
              logo_url={brand.logo_url}
            />
          )}
        />
      </div>
    </div>
  );
}
