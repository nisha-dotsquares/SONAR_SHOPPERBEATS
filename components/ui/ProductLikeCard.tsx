

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCreateWishlistMutation } from "@/lib/redux/apis/cartApi";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils/formatPrice";
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { useRouter, usePathname } from 'next/navigation';

interface ProductLikeCardProps {
  image: string;
  title: string;
  price: string;
  oldPrice?: string;
  rating: number;
  reviewCount: number;
  linkHref: string;
  discountPercentage?: number;
  saveAmount?: number;
  productId: string;
  variantId?: string;
}

export default function ProductLikeCard({
  image,
  title,
  price,
  oldPrice,
  rating,
  reviewCount,
  linkHref,
  productId,
  variantId,
}: ProductLikeCardProps) {
  const [createWishlist, { isLoading: isAddingToWishlist }] =
    useCreateWishlistMutation();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname();
  // Generate star icons
  const renderStars = (starRating: number) => {
    const stars = Array.from({ length: rating }, (_, i) => {
      if (i < Math.floor(starRating)) return "fa fa-star star filled";
      if (i < starRating) return "fa fa-star-half-alt star filled";
      return "fa fa-star star";
    });
    return (
      <div className="rating">
        {stars.map((cls, idx) => (
          <i key={idx} className={cls}></i>
        ))}
        <span className="review-count">({rating})</span>
      </div>
    );
  };

  const handleWishlistButtonClick = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault(); // Prevent default link behavior
    e.stopPropagation(); // Stop propagation to prevent triggering the product link

    if (!isAuthenticated) {
      toast.error("Please login to add to wishlist");
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    try {
      await createWishlist({
        product_id: productId,
        variant_id: variantId,
      }).unwrap();
      toast.success("Product added to wishlist!");
    } catch (err) {
      console.error("Failed to add to wishlist:", err);
      toast.error("Failed to add product to wishlist.");
    }
  };

  return (
    <Link href={linkHref}>
      <div className="product-card">
        <div className="product-image">
          <Image src={image} alt={title} width={140} height={132} />
        </div>

        <div className="product-details">
          <h4 className="product-title">{title}</h4>

          <div className="product-price">
            <span className="price">${formatPrice(price)}</span>
            {oldPrice && <span className="old-price">WAS: ${formatPrice(oldPrice)}</span>}
          </div>

          {rating > 0 && renderStars(rating)}
        </div>
        <div className="product-hover">
          <Button
            className="btn btn-blue btn-filled btn-rounded filled-wishlist"
            onClick={handleWishlistButtonClick}
            disabled={isAddingToWishlist}
            isLoading={isAddingToWishlist}
            debounceDelay={500}
          >
            {isAddingToWishlist ? (
              <span className="loading-spinner"></span>
            ) : (
              <Image
                src="/images/wishlist.svg"
                alt="wishlist"
                width={24}
                height={24}
              />
            )}
          </Button>
        </div>
      </div>
    </Link>
  );
}
