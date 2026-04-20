import Image from 'next/image';
import { useCreateWishlistMutation, useRemoveFromWishlistMutation, useGetWishlistQuery } from "@/lib/redux/apis/cartApi";
import { toast } from "react-toastify";
import Link from "next/link";
import React, { useState, memo, useMemo, useCallback, useEffect } from "react";
import Button from "@/components/ui/Button";
import { WishlistItem, WishlistKey } from '@/types/wishlist';
import { formatPrice } from "@/lib/utils/formatPrice";
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { useRouter, usePathname } from 'next/navigation';
import { Variant } from '@/types/product';

import { NAMED_COLORS, getSwatchColor } from "@/lib/utils/colorUtils";



/** Extract unique colour variants (those with a "color" attribute). */
function getColorVariants(variants: Variant[]): { id: string; color: string }[] {
  const seen = new Set<string>();
  const result: { id: string; color: string }[] = [];
  for (const v of variants) {
    const colorAttr = v.attributes?.find(
      (a) => a.name.toLowerCase() === 'color' || a.name.toLowerCase() === 'colour'
    );
    if (colorAttr && !seen.has(colorAttr.value.toLowerCase())) {
      seen.add(colorAttr.value.toLowerCase());
      result.push({ id: v.id, color: colorAttr.value });
    }
  }
  return result;
}

// ── Component ────────────────────────────────────────────────────────────────

interface ProductCardProps {
  image: string;
  title?: string;
  mainPrice?: number;
  wasPrice?: number;
  discountPercentage?: number;
  saveAmount?: number;
  freeShipping?: boolean;
  rating?: number;
  reviewCount?: number;
  id?: string;
  showWasPrice?: boolean;
  defaultVariantId?: string;
  variants?: Variant[];
  unique_code?: string;
  promotion_name?: string | null;
  stock?: number;
  tags?: string[];
}

const ProductCard: React.FC<ProductCardProps> = ({
  image,
  title,
  mainPrice,
  wasPrice,
  discountPercentage,
  saveAmount,
  freeShipping,
  rating = 0,
  reviewCount = 0,
  id,
  showWasPrice,
  defaultVariantId,
  variants = [],
  unique_code,
  promotion_name,
  stock,
  tags = [],
}) => {
  // Simple state for tracking if the current main image has loaded
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsImageLoaded(true);
    } else {
      setIsImageLoaded(false);
    }
  }, [image]);

  const [createWishlist, { isLoading: isAddingToWishlist }] = useCreateWishlistMutation();
  const [removeFromWishlist, { isLoading: isRemovingFromWishlist }] = useRemoveFromWishlistMutation();
  const [isHoveredWishlist, setIsHoveredWishlist] = useState(false);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname();

  // Local wishlist management
  const [localWishlistItems, setLocalWishlistItems] = useState<WishlistKey[]>([]);
  const [wishlistLoaded, setWishlistLoaded] = useState(false);
  const { data: wishlistData } = useGetWishlistQuery(undefined, {
    skip: wishlistLoaded,
  });

  const isWishlisted = localWishlistItems.some((item) => {
    if (!id) return false;
    const variantId = defaultVariantId ?? null;
    return item.product_id === id && item.variant_id === variantId;
  });

  // Generate star icons
  const stars = useMemo(() =>
    Array.from({ length: rating }, (_, i) => {
      if (i < Math.floor(rating)) return "fa fa-star star filled";
      if (i < rating) return "fa fa-star-half-alt star filled";
      return "fa fa-star star";
    }), [rating]
  );

  // Colour swatches derived from variants
  const colorVariants = useMemo(() => getColorVariants(variants), [variants]);
  const MAX_SWATCHES = 5;
  const visibleSwatches = colorVariants.slice(0, MAX_SWATCHES);
  const extraCount = colorVariants.length - MAX_SWATCHES;

  useEffect(() => {
    if (wishlistData?.items && !wishlistLoaded) {
      setLocalWishlistItems(
        wishlistData.items.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
        }))
      );
      setWishlistLoaded(true);
    }
  }, [wishlistData, wishlistLoaded]);

  const handleWishlistButtonClick = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Save the wishlist intent so it can be completed after login
      sessionStorage.setItem('pendingWishlist', JSON.stringify({
        product_id: id,
        variant_id: defaultVariantId ?? null,
      }));
      toast.error("Please login to add to wishlist");
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!id || isAddingToWishlist || isRemovingFromWishlist) return;

    const productId = id;
    const variantId: string | null = defaultVariantId ?? null;
    const wasInWishlist = isWishlisted;

    // Optimistic update
    if (wasInWishlist) {
      setLocalWishlistItems((prev) =>
        prev.filter(
          (item) =>
            !(
              item.product_id === productId &&
              item.variant_id === variantId
            )
        )
      );
    } else {
      setLocalWishlistItems((prev) => [
        ...prev,
        { product_id: productId, variant_id: variantId },
      ]);
    }

    try {
      if (wasInWishlist) {
        await removeFromWishlist({
          product_id: productId,
          variant_id: variantId ?? undefined,
        }).unwrap();
        toast.success("Product removed from wishlist!");
      } else {
        await createWishlist({
          product_id: productId,
          variant_id: variantId ?? undefined,
        }).unwrap();
        toast.success("Product added to wishlist!");
      }
    } catch {
      toast.error("Failed to update wishlist.");

      // Revert optimistic update
      if (wasInWishlist) {
        setLocalWishlistItems((prev) => [
          ...prev,
          { product_id: productId, variant_id: variantId },
        ]);
      } else {
        setLocalWishlistItems((prev) =>
          prev.filter(
            (item) =>
              !(
                item.product_id === productId &&
                item.variant_id === variantId
              )
          )
        );
      }
    }
  };

  return (
    <div className="card-wrapper">

  {tags?.length > 0 ? (
    <div className="badge min-w-[70px] flex items-center justify-center">
      <span className="badge-text">{tags[0]}</span>
    </div>
  ) : (
    <>
      {promotion_name ? (
        <div className="badge">
          <img
            src="/images/sale1.svg"
            alt="Sale"
            className="badge-img"
          />
          <span className="badge-text">SALE</span>
        </div>
      ) : stock !== undefined && stock > 0 && stock < 5 ? (
        <div className="badge low-stock-badge">
          <img
            src="/images/low-stock1.svg"
            alt="Low Stock"
            className="badge-img"
          />
          <span className="badge-text">LOW STOCK</span>
        </div>
      ) : null}
    </>
  )}
    <div className="product-card">
      <Link href={`/product/${unique_code || id}`}>
        <div className="product-image" style={{ position: 'relative' }}>
          {!isImageLoaded && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s infinite',
                borderRadius: 4,
                zIndex: 1,
              }}
            />
          )}

          <img
            ref={imgRef}
            src={image}
            alt={title}
            width={206}
            height={148}
            onLoad={() => setIsImageLoaded(true)}
            onError={() => setIsImageLoaded(true)} // Stop shimmering if image fails to load
            style={{ opacity: isImageLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
          />

        </div>

        <div className="product-details">
          <div className="product-tags">
            {freeShipping && (
              <Button className="btn btn-red btn-outline btn-rounded promotion-tag">
                Free Shipping
              </Button>
            )}
            {saveAmount ? (
              <Button className="btn btn-red btn-filled btn-sharp sale-tag">
                Save $ {formatPrice(saveAmount)}
              </Button>
            ) : ""}
          </div>

          <h4 className="product-title">{title}</h4>

          {/* ── Colour swatches ── */}
          {colorVariants.length > 1 && (
            <div className="variant-swatches">
              {visibleSwatches.map((v) => (
                <button
                  key={v.id}
                  className="swatch"
                  style={{ backgroundColor: getSwatchColor(v.color) }}
                  title={v.color}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/product/${v.id}`);
                  }}
                />
              ))}
              {extraCount > 0 && (
                <span className="swatch-more">+{extraCount}</span>
              )}
              <span className="swatch-label">
                {colorVariants.length} Colour{colorVariants.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          <div className="product-price">
            <span className="price">${formatPrice(mainPrice)}</span>

            {/* WAS Price */}
            {showWasPrice && wasPrice && (
              <span className="old-price">WAS: ${formatPrice(wasPrice)}</span>
            )}
          </div>

          {rating > 0 && <div className="rating">
            {stars.map((cls, idx) => (
              <i key={idx} className={cls}></i>
            ))}
            <span className="review-count">({rating})</span>
          </div>}
        </div>
      </Link>
      <div className="product-hover">

        {/* <Button
            type="button"
            className={`btn btn-blue btn-filled btn-rounded filled-wishlist ${isWishlisted ? 'wishlisted' : ''}`}
            onClick={handleWishlistButtonClick}
            disabled={isAddingToWishlist || isRemovingFromWishlist}
          >
          <img
  src="/images/wishlist.svg"
  alt="wishlist"/>

          </Button> */}

        <Button
          className={`wishlist-btn ${isWishlisted ? "active" : ""}`}
          onClick={handleWishlistButtonClick}
          onMouseEnter={() => setIsHoveredWishlist(true)}
          onMouseLeave={() => setIsHoveredWishlist(false)}
          debounceDelay={500}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={isWishlisted || isHoveredWishlist ? "red" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-heart w-6 h-6"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
          </svg>
        </Button>
      </div>
    </div>
    </div>
  );
};

export default memo(ProductCard);
