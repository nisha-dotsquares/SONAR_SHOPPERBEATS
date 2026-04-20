"use client";

import React from "react";
import ReusableSlider from "../ui/ReusableSlider";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Deal {
  image: string;
  title: string;
  href?: string;
}

const DealBlock: React.FC<Deal> = ({ image, title, href }) => {
  const content = (
    <div className="deals-block">
      <div className="deals-img bg-white">
        <Image src={image} alt={title} width={100} height={100} style={{ width: '100%', height: 'auto', maxWidth: '100px', objectFit: 'contain' }} />
      </div>
      <h5 className="align-center mt-18">{title}</h5>
    </div>
  );

  if (href) {
    return (
      <Link href={href}>
        {content}
      </Link>
    );
  }
  return content;
};

export default function TopDeals() {
  const deals: Deal[] = [
    { image: "/images/deals.svg", title: "Today Deals", href: "/product-listing/today-s-deal" },
    { image: "/images/home/Vector4.png", title: "Coupons", href: "/product-listing/coupons" },
    { image: "/images/home/Vector3.png", title: "Top Sellers", href: "/product-listing/best-sellers" },
    { image: "/images/home/Vector2.png", title: "Price Drop", href: "/product-listing/price-drop" },
    { image: "/images/home/Vector1.png", title: "Free Shipping", href: "/product-listing/free-shipping" }, // "use lisrt-products with filter free-shipping" handled via page param configuration
    { image: "/images/home/Vector6.png", title: "Top Rated", href: "/product-listing/top-rated" },
  ];

  return (
    <div className="top-deals pb-70">
      <div className="container">
        <ReusableSlider
          items={deals}
          slidesToShow={6}
          slidesToScroll={4}
          centered={false}
          speed={800}
          infinite={false}
          autoplaySpeed={0}
          arrows={true} // navigation only
          // pauseOnHover={true}
          gap={20} // gap between items
          renderItem={(deal) => <DealBlock key={deal.title} {...deal} />}
        />
      </div>
    </div>
  );
}
