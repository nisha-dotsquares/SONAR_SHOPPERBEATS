"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAddToCartMutation, useCreateWishlistMutation, useGetCartQuery, useGetWishlistQuery, useRemoveFromWishlistMutation, } from "@/lib/redux/apis/cartApi";
import { useGetProductBySlugQuery } from "@/lib/redux/apis/productsApi";
import { useCalculateShippingMutation } from "@/lib/redux/apis/orderApi";
import Image from "next/image";
import ReusableSlider from "@/components/ui/ReusableSlider";
import ProductGallery from "../productListing/ProductGallery";
import ProductLikeCard from "@/components/ui/ProductLikeCard";
import { toast } from "react-toastify";
import "../../styles/ProductDetail.css";
import "../../styles/Cart.css";
import RecentlyViewed from "../homepage/RecentlyViewed";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { Product, Category } from "@/types/product";
import { ProductSEO } from "@/types/seo";
import Accordion from "../ui/Accordion";
import ReviewCard from "../ui/ReviewCard";
import ProductCarousel from "../ui/ProductCarousel";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ReviewPopup from "../ui/ReviewPopup";
import { useDispatch, useSelector } from "react-redux";
import { setBreadcrumbs } from "@/lib/redux/slices/breadcrumbSlice";
import { useGlobalPostcode } from "@/lib/hooks/useGlobalPostcode";
import { RootState } from "@/lib/redux/store";
import { findCategoryPath } from "@/lib/utils/findCategoryPath";
import { getPriceDetails } from "@/lib/utils/getPriceDetails";
import { getImageUrl } from "@/lib/utils/imageUtils";
import DeliveryDetailsPopup from "../ui/DeliveryDetailsPopup";
import { renderContent } from "@/lib/utils/renderContent";
import { useVariantSelection } from "@/lib/hooks/useVariantSelection";
import { WishlistKey } from "@/types/wishlist";
import { useFormValidation } from "@/lib/hooks/useFormValidation";
import { pincode as pincodeValidation } from "@/lib/hooks/useYupValidation";
import * as yup from "yup";
import GooglePlacesInput from "@/components/ui/AddressAutocomplete";
import BundleSection from "../ui/BundleSection";
import { useSEO } from "@/contexts/SEOContext";
import { getDeliveryTabContent, warrantyAndReturnContent } from "@/lib/utils/productTabContent";
import Swal from "sweetalert2";
import Link from "next/link";
import { formatPrice } from "@/lib/utils/formatPrice";
import { usePathname } from "next/navigation";
import getEstimatedDeliveryRange from "@/lib/utils/getEstimatedDeliveryRange";


export default function ProductDetailClient({
  product,
  recommendations,
  popularProducts,
  megaMenuData,
  slug,
  seo,
  recentlyViewed,
}: {
  product: Product;
  recommendations: Product[] | null;
  popularProducts: Product[] | null;
  megaMenuData: Category[];
  slug: string;
  seo?: ProductSEO;
  recentlyViewed?: Product[] | null;
}) {
  const { updateMetadata } = useSEO();

  useEffect(() => {
    const mainImage = getImageUrl(product);
    const cleanDescription = seo?.meta_description?.replace(/<[^>]+>/g, '').substring(0, 160) || 
      product.description?.replace(/<[^>]+>/g, '').substring(0, 160);

    updateMetadata({
      title: seo?.page_title || product.title,
      description: cleanDescription,
      keywords: seo?.meta_keywords,
      canonical_url: seo?.canonical_url,
      og_title: seo?.page_title || product.title,
      og_image: [mainImage],
      twitter_cards_title: seo?.page_title || product.title,
      twitter_cards_type: "summary_large_image",
    });
  }, [product, seo]);
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const [isHoveredWishlist, setIsHoveredWishlist] = useState(false);
  const { attributeNames, selectedAttributes, selectedVariant, filteredAttributes, handleAttributeChange, resetAttributes, setSelectedVariant, setSelectedAttributes } = useVariantSelection(product.variants || []);

  // CSR fetch for product details to trigger cookies natively. Disregard data
  useGetProductBySlugQuery(slug, {
    skip: !slug,
  });

  // Pre-select variant if slug is a variant_id
  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      const variantMatch = product.variants.find(v => v.id === slug);
      if (variantMatch) {
        setSelectedVariant(variantMatch);
        const attrs: Record<string, string> = {};
        variantMatch.attributes.forEach(attr => {
          attrs[attr.name.toLowerCase()] = attr.value;
        });
        setSelectedAttributes(attrs);
        return; // slug was a variant — don't auto-select below
      }

      // No slug match → auto-select the first in-stock variant
      const firstInStock = product.variants.find(v => (v.stock ?? 0) > 0);
      const variantToSelect = firstInStock ?? product.variants[0]; // fallback to first if all OOS

      setSelectedVariant(variantToSelect);
      const attrs: Record<string, string> = {};
      variantToSelect.attributes.forEach(attr => {
        attrs[attr.name.toLowerCase()] = attr.value;
      });
      setSelectedAttributes(attrs);
    }
  }, [slug, product.variants, setSelectedVariant, setSelectedAttributes]);

  const [createWishlist, { isLoading: isAddingToWishlist }] = useCreateWishlistMutation();
  const [removeFromWishlist, { isLoading: isRemoving }] = useRemoveFromWishlistMutation();
  const [calculateShipping, { isLoading: isCalculatingShipping }] = useCalculateShippingMutation();

  const { postcode, suburb, updatePostcode } = useGlobalPostcode();
  const { data: cart } = useGetCartQuery(postcode ? { postcode: postcode } : undefined, {
    refetchOnMountOrArgChange: true,
  });

  // Fetch wishlist once and manage locally
  const { data: wishlistData } = useGetWishlistQuery(undefined, {
    refetchOnMountOrArgChange: false, // Only fetch once
  });

  const [localWishlistItems, setLocalWishlistItems] = useState<WishlistKey[]>([]);
  const [wishlistLoaded, setWishlistLoaded] = useState(false);

  // Pincode validation schema
  const pincodeSchema = yup.object().shape({
    pincode: pincodeValidation,
  });

  const { formData, formErrors, handleChange, handleSubmit, setFormData } =
    useFormValidation(pincodeSchema, { pincode: postcode || "" });

  const [shippingCharge, setShippingCharge] = useState<number | null>(null);
  const [shippingStatus, setShippingStatus] = useState<
    "idle" | "checking" | "available" | "unavailable"
  >("idle");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [selectedLocation, setSelectedLocation] = useState<{
    pincode: string;
    suburb: string;
    state?: string;
  } | null>(null);

  // Load wishlist data once
  useEffect(() => {
    if (wishlistData?.items && !wishlistLoaded) {
      setLocalWishlistItems(wishlistData.items);
      setWishlistLoaded(true);
    }
  }, [wishlistData, wishlistLoaded]);

  const router = useRouter();

  const isProductInWishlist = localWishlistItems.some((item) => {
    const isSameProduct = item.product_id === product.id;
    if (!selectedVariant) {
      return isSameProduct;
    }
    return isSameProduct && item.variant_id === selectedVariant.id;
  });

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const pathname = usePathname();

  const handleWishlistButtonClick = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error("Please login to add to wishlist");
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    const hasVariants =
      product?.variants && product.variants.length > 0;

    //  Variant required but not selected
    if (hasVariants && !selectedVariant?.id) {
      toast.error("Choose your preferred option before adding to wishlist!");
      return;
    }
    if (!product?.id || isAddingToWishlist || isRemoving) return;
    const variantId = selectedVariant?.id ?? null;
    const productId = product.id;
    const wasInWishlist = isProductInWishlist;

    // Optimistically update local state
    if (wasInWishlist) {
      setLocalWishlistItems(prev =>
        prev.filter(item =>
          !(item.product_id === product.id && item.variant_id === variantId)
        )
      );
    } else {
      setLocalWishlistItems(prev => [
        ...prev,
        { product_id: productId, variant_id: variantId }
      ]);
    }

    try {
      if (wasInWishlist) {
        await removeFromWishlist({
          product_id: product.id,
          variant_id: selectedVariant?.id,
        }).unwrap();
        toast.success("Product removed from wishlist!");
      } else {
        await createWishlist({
          product_id: product.id,
          variant_id: selectedVariant?.id,
        }).unwrap();
        toast.success("Product added to wishlist!");
      }
    } catch {
      toast.error("Failed to update wishlist.");
      if (!product?.id) return;
      const revertProductId: string = product.id;
      const revertVariantId: string | null = selectedVariant?.id ?? null;
      // Revert optimistic update on failure
      if (wasInWishlist) {
        setLocalWishlistItems(prev => [
          ...prev,
          { product_id: revertProductId, variant_id: revertVariantId },
        ]);
      } else {
        setLocalWishlistItems(prev =>
          prev.filter(item =>
            !(item.product_id === product.id && item.variant_id === selectedVariant?.id)
          )
        );
      }
    }
  }, [product?.id, selectedVariant?.id, isProductInWishlist, createWishlist, removeFromWishlist, isAddingToWishlist, isRemoving]);

  const [quantity, setQuantity] = useState(1);

  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [activeTab, setActiveTab] = useState("description"); // Default active tab
  const [showDeliveryPopup, setShowDeliveryPopup] = useState(false);

  const handleOpenReviewPopup = () => setShowReviewPopup(true);
  const handleCloseReviewPopup = () => setShowReviewPopup(false);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };
  const isProductInCart = useMemo(() => {
    if (!selectedVariant?.id) return false;

    return cart?.items?.some(
      (item) =>
        item.product_id === product.id &&
        item.variant_id === selectedVariant.id
    );
  }, [cart?.items, product.id, selectedVariant?.id]);


  const handleBuyNow = async () => {
    const hasVariants = product?.variants && product.variants.length > 0;
    if (hasVariants && !selectedVariant?.id) {
      toast.error("Choose your preferred option before buying !");
      return;
    }

    if (product && product.id) {
      try {
        await addToCart({
          productId: product.id,
          quantity: quantity,
          variant_id: selectedVariant?.id,
          vendor_id: product.vendor_id,
          postcode: postcode,
        }).unwrap();

        router.push("/checkout");

      } catch (err) {
        const error = err as { data?: { detail?: string; error?: string }; message?: string };
        const errorMessage =
          error?.data?.detail ||
          error?.data?.error ||
          error?.message ||
          "Failed to add product to cart.";
        toast.error(errorMessage);
      }
    }
  };

  const handleCartButtonClick = useCallback(async () => {
    if (isProductInCart) {
      router.push("/cart");
      return;
    }

    const hasVariants = product?.variants && product.variants.length > 0;

    if (hasVariants && !selectedVariant?.id) {
      toast.error("Choose your preferred option before adding to cart!");
      return;
    }

    if (product && product.id) {
      try {
        await addToCart({
          productId: product.id,
          quantity: quantity,
          variant_id: selectedVariant?.id,
          vendor_id: product.vendor_id,
          postcode: postcode,
        }).unwrap();
        toast.success("Product added to cart!");
      } catch (err) {
        const error = err as { data?: { detail?: string; error?: string }; message?: string };
        const errorMessage =
          error?.data?.detail ||
          error?.data?.error ||
          error?.message ||
          "Failed to add product to cart.";
        toast.error(errorMessage);
      }
    }
  }, [isProductInCart, router, addToCart, product, selectedVariant, quantity]);

  const openDeliveryPopup = () => setShowDeliveryPopup(true);
  const closeDeliveryPopup = () => setShowDeliveryPopup(false);

  // Generate star icons
  const renderStars = useCallback(
    (rating: number | null | undefined) => {
      if (rating === null || rating === undefined) {
        return null;
      }
      const stars = Array.from({ length: rating }, (_, i) => {
        if (i < Math.floor(rating)) return "fa fa-star star filled";
        if (i < rating) return "fa fa-star-half-alt star filled";
        return "fa fa-star star";
      });
      return (
        <div className="rating">
          {stars.map((cls, idx) => (
            <i key={idx} className={cls}></i>
          ))}
          <span className="review-count">
            {product.review_stats ? product.review_stats.total_reviews : 0}{" "}
            Reviews
          </span>
        </div>
      );
    },
    [product.review_stats]
  );
  const isOutOfStock = useMemo(() => {
    const hasVariants = product.variants && product.variants.length > 0;

    if (hasVariants) {
      // If no variant selected yet → don’t show out of stock
      if (!selectedVariant) return false;

      return (selectedVariant.stock ?? 0) <= 0;
    }

    return (product.stock ?? 0) <= 0;
  }, [product, selectedVariant]);


  // Generate product title with variant attributes
  const productTitle = useMemo(() => {
    if (!selectedVariant || !selectedVariant.attributes || selectedVariant.attributes.length === 0) {
      return product.title || "";
    }
    const attributeValues = selectedVariant.attributes
      .filter(attr => attr.value && attr.value.trim() !== "")
      .map(attr => attr.value)
      .join(" | ");
    return attributeValues ? `${product.title} ${attributeValues}` : product.title || "";
  }, [product.title, selectedVariant]);

  const roundValue = (v?: string | number) => Math.round(Number(v ?? 0));

  const length = roundValue(selectedVariant?.length ?? product?.length);
  const width = roundValue(selectedVariant?.width ?? product?.width);
  const weight = roundValue(selectedVariant?.weight ?? product?.weight);
  const height = roundValue(selectedVariant?.height ?? product?.height);

  const precautionaryNote =
    selectedVariant?.precautionary_note?.trim() ||
    product?.precautionary_note?.trim();

  const careInstructions =
    selectedVariant?.care_instructions?.trim() ||
    product?.care_instructions?.trim();

  const warranty =
    selectedVariant?.warranty?.trim() ||
    product?.warranty?.trim();

  const accordionItems = [
    //  Show Specifications only if at least one value exists
    ...(length || width || weight || height
      ? [
        {
          title: "Specifications",
          id: "specifications",
          content: (
            <ul>
              {length && (
                <li>
                  <b>Length :-</b> {length} cm
                </li>
              )}
              {width && (
                <li>
                  <b>Width :-</b> {width} cm
                </li>
              )}
              {weight && (
                <li>
                  <b>Weight :-</b> {weight} Kg
                </li>
              )}
              {height && (
                <li>
                  <b>Height :-</b> {height} cm
                </li>
              )}
            </ul>
          ),
        },
      ]
      : []),

    //  Show only if precaution or care exists
    ...(precautionaryNote || careInstructions
      ? [
        {
          title: "Precautionary & Care Instructions",
          id: "care",
          content: (
            <ul>
              {precautionaryNote && (
                <li>
                  <b>Precautionary Note :-</b> {precautionaryNote}
                </li>
              )}
              {careInstructions && (
                <li>
                  <b>Care Instructions :-</b> {careInstructions}
                </li>
              )}
            </ul>
          ),
        },
      ]
      : []),

    //  Show Warranty only if exists
    ...(warranty
      ? [
        {
          title: "Warranty",
          id: "warranty",
          content: (
            <ul>
              <li>{warranty}</li>
            </ul>
          ),
        },
      ]
      : []),
  ];
  const mergedAccordions = [...accordionItems];
  const middleIndex = Math.ceil(mergedAccordions.length / 2);

  const firstHalf = mergedAccordions.slice(0, middleIndex);
  const secondHalf = mergedAccordions.slice(middleIndex);
  const dispatch = useDispatch();

  // Update form when global postcode changes
  useEffect(() => {
    if (postcode) {
      setFormData(prev => ({ ...prev, pincode: postcode }));
    }
  }, [postcode, setFormData]);

  useEffect(() => {
    if (!product || !product.category_id) return;
    //  Find hierarchical category path using the same logic as Category Page
    const categoryPath =
      findCategoryPath(megaMenuData, product.category_id) || [];

    // Add the current product at the end
    const fullPath = [
      ...categoryPath,
      {
        name: product.title || "Untitled Product",
        path: `/product/${product.unique_code || product.id}`,
      },
    ];
    dispatch(setBreadcrumbs(fullPath));
  }, [product, megaMenuData, dispatch]);

  // This is the core logic for checking shippability
  const checkProductShippability = useCallback(async (currentPostcode: string) => {
    if (!currentPostcode || !product) return;

    // Reset shippability state before checking
    setShippingStatus("checking");
    setShippingCharge(null);

    try {
      const productIdentifier = selectedVariant?.sku || product.sku || product.id;

      const response = await calculateShipping({
        postcode: currentPostcode,
        product_identifier: productIdentifier
      }).unwrap();

      if (response.shipping_cost === "ns" || response.shipping_cost === null) {
        setShippingCharge(null);
        setShippingStatus("unavailable");
        // toast.error("Delivery is not available in your selected region");
      } else {
        const shippingCost = Number.parseFloat(response.shipping_cost) || 0;
        setShippingCharge(shippingCost);
        setShippingStatus("available");
      }
    } catch {
      setShippingCharge(null);
      setShippingStatus("unavailable");
      // toast.error("Invalid Pincode");
    }
  }, [calculateShipping, product, selectedVariant]);

  const checkProductShippabilityRef = useRef(checkProductShippability);
  useEffect(() => {
    checkProductShippabilityRef.current = checkProductShippability;
  });

  // Button click handler — validates the pincode field first
  const handleCheckDelivery = useCallback(
    handleSubmit(async (data) => {
      checkProductShippabilityRef.current(data.pincode);
    }) as (e?: React.FormEvent) => Promise<void>,
    [handleSubmit]
  );


  useEffect(() => {
    if (!postcode || !product) return;
    let active = true;
    const id = setTimeout(() => {
      if (active) checkProductShippabilityRef.current(postcode);
    }, 0);
    return () => {
      active = false;
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postcode, selectedVariant, product]);

  const { mainPrice, wasPrice, showWasPrice, saveAmount, discountPercentage } =
    useMemo(
      () => getPriceDetails(product, selectedVariant),
      [product, selectedVariant]
    );

  const handleDisabledAddToCart = () => {
    if (isAddingToCart) return;
    toast.error("Please select all required variants!");
  };


  const openVariantInfoPopup = () => {
    Swal.fire({
      title: "How Option Selection Works",
      html: `
      <p style="margin-bottom:8px;">
        If you choose the first option in the list, your previous selections will be cleared.
      </p>
      <p style="margin-bottom:8px;">
        This will show all available sizes, colors, and other options again.
      </p>
      <p>
        Please select your preferred options before adding the product to your cart.
      </p>
    `,
      icon: "info",
      confirmButtonText: "Got It",
      confirmButtonColor: "#fd151b",
    });
  };



  return (
    <div className="">
      <Breadcrumb /> {/* Added Breadcrumb */}
      <div className="product-page container">
        <div className="grid-2">
          <ProductGallery product={product} selectedVariant={selectedVariant} />
          <div className="product-detail">
            <div className="dflex">
              <div className="detail-title">
                <div className="flex align-center gap-2">
                  {product.promotion_name &&
                    <div className="promotion-badge">
                      <img
                        src="/images/sale.svg"
                        alt="Sale"
                        className="badge-img"
                      />
                      <span className="badge-text">SALE</span>
                    </div>}
                  {(selectedVariant ? selectedVariant.stock : product.stock) !== undefined && (selectedVariant ? selectedVariant.stock : product.stock)! > 0 && (selectedVariant ? selectedVariant.stock : product.stock)! < 5 &&
                    <div className="promotion-badge low-stock-badge">
                      <img
                        src="/images/low-stock.svg"
                        alt="Low Stock"
                        className="badge-img"
                      />
                      <span className="badge-text">LOW STOCK</span>
                    </div>
                  }
                  {shippingCharge === 0 && (
                    <div
                      className="shipping-success"
                    >
                      <Image
                        src="/images/free-shipping.svg"
                        alt="Free Shipping"
                        width={20}
                        height={20}
                      />
                      <span>FREE Shipping</span>
                    </div>
                  )}
                  {product.tags && product.tags.length > 0 && (
                    <div className="promotion-badge tag-badge">
                      <Button className="btn-yellow btn-outline btn-rounded promotion-tag">
                        {product.tags[0]}
                      </Button>
                    </div>
                  )}
                </div>
                <h5>{productTitle}</h5>
                <p>
                  <Link style={{ textDecoration: "underline" }} href={`/brand/${product.brand_slug}`}>
                    {product.brand_name}
                  </Link>
                </p>
              </div>
              <Button
                className={`wishlist-btn cursor-pointer ${isProductInWishlist
                  ? "active"
                  : ""
                  }`}
                disabled={isAddingToWishlist || isRemoving}
                onClick={handleWishlistButtonClick}
                onMouseEnter={() => setIsHoveredWishlist(true)}
                onMouseLeave={() => setIsHoveredWishlist(false)}
                debounceDelay={0}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill={
                    isProductInWishlist
                      ? "red"
                      : "none"
                  }
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

            {product.review_stats &&
              product.review_stats.total_reviews > 0 &&
              renderStars(product.review_stats.average_rating)}


            <div className="product-price">
              {/* MAIN PRICE */}
              <span className="price">${formatPrice(mainPrice)}</span>

              {/* WAS PRICE */}
              {showWasPrice && (
                <span className="old-price">WAS: ${formatPrice(wasPrice)}</span>
              )}
            </div>

            {discountPercentage > 0 && (
              <div className="product-save">
                <span>You Save: ${formatPrice(saveAmount)}</span>
                <Button   style={{ cursor: "default" }} className="btn btn-red btn-filled btn-sharp sale-tag">
                  {discountPercentage.toFixed(0)}% Off
                </Button>
              </div>
            )}

            {/* {shippingCharge !== null && shippingCharge > 0 && (
              <p className="shipping-info mb-20">
                Shipping: ${formatPrice(shippingCharge)}
              </p>
            )} */}



            <div className="free-shipping">
              {/* {product.free_shipping || shippingCharge == 0 && (
                <>
                  <Image
                    src="/images/free-shipping.svg"
                    alt="shipping"
                    width={20}
                    height={20}
                  />
                  <div className="shipping-text">
                    <p>Free shipping</p>
                  </div>
                </>
              )} */}
              <span>
                {product.handling_time_days === 1 ? (
                  "Leaves warehouse in Next business day"
                ) : (
                  <>
                    Leaves warehouse in{" "}
                    {`1-${product.handling_time_days}
                       Business days`}
                  </>
                )}
              </span>

              {product.variants && product.variants.length > 0 && product.variants[0].attributes.length > 1 &&
                <span className="variant-info-text">
                  To see all available options again, choose the first option in the list.&nbsp;

                  <button
                    type="button"
                    onClick={openVariantInfoPopup}
                    className="delivery-link"
                  >
                    View More Info
                  </button>
                </span>
              }
            </div>

            {attributeNames.map((attrName) => {
              const availableOptions = (
                filteredAttributes[attrName] || []
              ) as { value: string; stock: number | undefined }[]; // Cast to the new type

              return (
                <div key={attrName} className="product-attribute-selector">
                  <label htmlFor={`attr-${attrName}`}>{attrName.charAt(0).toUpperCase() + attrName.slice(1)}</label>
                  <select
                    id={`attr-${attrName}`}
                    value={selectedAttributes[attrName] || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      value === ""
                        ? resetAttributes()
                        : handleAttributeChange(attrName, value);
                    }}
                  >
                    <option value="">Select {attrName.charAt(0).toUpperCase() + attrName.slice(1)}</option>
                    {availableOptions.map((item) => (
                      <option
                        key={item.value}
                        value={item.value}
                        disabled={(item.stock ?? 0) <= 0} // Disable if stock is 0 or undefined
                      >
                        {item.value} {(item.stock ?? 0) <= 0 ? "(Out of Stock)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}

            <div className="product-attribute-selector">
              <label htmlFor="product-quantity">Quantity:</label>
              <select
                id="product-quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Pincode Check */}

            <div className="promo">
              <label htmlFor="deliveryPincode" className="visually-hidden">Check Delivery Pincode</label>
              <GooglePlacesInput
                id="deliveryPincode"
                mode="pincode"
                placeholder="Enter Pincode or Suburb"
                value={
                  mounted
                    ? selectedLocation
                      ? [selectedLocation.suburb, selectedLocation.state, selectedLocation.pincode]
                        .filter(Boolean)
                        .join(" ")
                      : postcode
                        ? [suburb, postcode].filter(Boolean).join(" ")
                        : formData.pincode
                    : ""
                }
                onPlaceSelect={(data) => {
                  if (!data.pincode) {
                    toast.error("Please select a valid pincode");
                    return;
                  }

                  handleChange({
                    target: { name: "pincode", value: data.pincode },
                  } as React.ChangeEvent<HTMLInputElement>);
                  updatePostcode(data.pincode, data.city || "Melbourne");
                  setSelectedLocation({
                    pincode: data.pincode,
                    suburb: data.city,
                    state: data.state,
                  });
                  setShippingCharge(null);
                }}
                onClear={() => {
                  handleChange({
                    target: { name: "pincode", value: "" },
                  } as React.ChangeEvent<HTMLInputElement>);
                  updatePostcode("", "");
                  setShippingCharge(null);
                  setSelectedLocation(null);
                }}
              />

              <button
                onClick={handleCheckDelivery}
                className="cursor-pointer"
                disabled={isCalculatingShipping}
              >
                {isCalculatingShipping ? "Checking..." : "Check Delivery"}
              </button>
            </div>
            {shippingCharge !== null && (
              <div className="shipping-result">
                {shippingStatus === "available" && shippingCharge !== null && (
                  <div className="shipping-result">
                    {shippingCharge !== 0 && (
                      <p style={{ fontWeight: 700, color: "var(--primary)" }}>
                        ${formatPrice(shippingCharge)} Delivery Fee
                      </p>
                    )}
                    <p style={{ fontWeight: 600, color: "black" }}>
                      {getEstimatedDeliveryRange(
                        product.ships_from_location,
                        product.handling_time_days || 0
                      )}
                    </p>

                    <p style={{ fontSize: "14px", marginTop: "4px", color: "#666" }}>
                      {product.ships_from_location === "SBAU" ||
                        product.ships_from_location === "Local 3PL"
                        ? ""
                        : "Product will be shipped from outside Australia."}
                    </p>
                  </div>
                )}
              </div>
            )}
            {formErrors.pincode && (
              <p className="error">{formErrors.pincode}</p>
            )}

            {/* Error message for non-shippable */}
            {shippingStatus === "unavailable" && (
              <p className="error text-red-500 mb-20">
                This product cannot be shipped to your selected region.
              </p>
            )}

            <div className="btn-action">
              {(() => {
                const hasVariants = product.variants && product.variants.length > 0;

                const shouldDisableAddToCart =
                  (hasVariants && !selectedVariant) || shippingStatus === "unavailable";

                if (isOutOfStock) {
                  return (
                    <Button
                      disabled
                      className="btn btn-out-of-stock"
                      debounceDelay={0}
                    >
                      Out of Stock
                    </Button>
                  );
                }

                return (
                  <>
                    <Button
                      disabled={isAddingToCart || shippingStatus === "unavailable"} // Added !isShippable
                      onClick={
                        shouldDisableAddToCart || isAddingToCart
                          ? handleDisabledAddToCart
                          : handleCartButtonClick
                      }
                      className={`btn btn-red btn-filled btn-sharp
            ${isProductInCart ? "added-to-cart" : ""}
            ${shouldDisableAddToCart ? "disabled" : ""}
          `}
                      aria-disabled={shouldDisableAddToCart}
                      debounceDelay={500}
                    >
                      {isAddingToCart
                        ? "Adding..."
                        : isProductInCart
                          ? "Go to Cart"
                          : "Add to Cart"}
                    </Button>

                    <Button
                      onClick={handleBuyNow}
                      disabled={shippingStatus === "unavailable"} // Added !isShippable
                      className="btn btn-red btn-outline btn-rounded"
                      debounceDelay={500}
                    >
                      Buy Now
                    </Button>
                  </>
                );
              })()}
            </div>


            <h5 className="mt-30">Secure ways to pay at checkout</h5>
            <div className="payment-logos">
              <div className="payment-img">
                {" "}
                <Image
                  src="/images/visa.svg"
                  alt="Visa"
                  width={50}
                  height={25}
                />
              </div>
              <div className="payment-img">
                <Image
                  src="/images/payment.svg"
                  alt="Payment"
                  width={50}
                  height={25}
                />
              </div>
              <div className="payment-img">
                <Image
                  src="/images/american.svg"
                  alt="American Express"
                  width={50}
                  height={25}
                />
              </div>
              <div className="payment-img">
                <Image
                  src="/images/paypal.svg"
                  alt="PayPal"
                  width={50}
                  height={25}
                />
              </div>
              <div className="payment-img">
                {" "}
                <Image
                  src="/images/afterpay.svg"
                  alt="Afterpay"
                  width={50}
                  height={25}
                />
              </div>
              <div className="payment-img">
                {" "}
                <Image src="/images/zip.svg" alt="Zip" width={50} height={25} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bundle Products Section */}
      {product.bundle_group_code && product.bundle_products && product.bundle_products.length > 0 && (
        <BundleSection bundleProducts={product.bundle_products} />
      )}
      {recommendations && recommendations.length > 0 && (
        <div className="products products-like pt-40">
          <div className="container">
            <div className="dflex justify-between mb-30 title-wrapper">
              <h2>You May Also Like </h2>
            </div>
            <ReusableSlider
              items={recommendations}
              slidesToShow={5}
              slidesToScroll={3}
              gap={20}
              infinite={false}
              arrows={true}
              pauseOnHover={false}
              renderItem={(product, index) => (
                <ProductLikeCard
                  productId={product.id!}
                  key={product.id}
                  image={getImageUrl(product)}
                  title={product.title || "Untitled Product"}
                  price={formatPrice(getPriceDetails(product).mainPrice)}
                  oldPrice={
                    getPriceDetails(product).hasDiscount
                      ? formatPrice(getPriceDetails(product).wasPrice)
                      : undefined
                  }
                  discountPercentage={
                    getPriceDetails(product).discountPercentage
                  }
                  saveAmount={getPriceDetails(product).saveAmount}
                  rating={
                    product.review_stats
                      ? product.review_stats.average_rating
                      : 0
                  }
                  reviewCount={
                    product.review_stats
                      ? product.review_stats.total_reviews
                      : 0
                  }
                  linkHref={`/product/${product.unique_code || product.id}`}
                />
              )}
            />
          </div>
        </div>
      )}
      <div className="product-tabs container pt-40">
        {/* <ul className="tab-nav dflex">
          <li
            className={activeTab === "description" ? "active" : ""}
            onClick={() => handleTabClick("description")}
          >
            Description
          </li>
          <li
            className={activeTab === "delivery" ? "active" : ""}
            onClick={() => handleTabClick("delivery")}
          >
            Delivery
          </li>
          <li
            className={activeTab === "warranty" ? "active" : ""}
            onClick={() => handleTabClick("warranty")}
          >
            Warranty and Return
          </li>
        </ul> */}
        <div className="tab-content">
          {activeTab === "description" && (
            <>
              <div className="tab-pane product-description">
                <div className="">
                  <h6 className="descrpt-title">Product Description</h6>
                  <div className="product-content">
                    {/* <img
                    src={getImageUrl(product)}
                    alt="Product Image"
                    // width={2000}
                    // height={300}
                  /> */}
                    <div className="product-description-content">
                      {renderContent(product.description) ||
                        "ShopperBeats continues to stand as the planet premier shopping destination..."}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid-4-8  mt-40">
                <Accordion items={firstHalf} variation={2} />

                <Accordion items={secondHalf} variation={2} />
              </div>
            </>

          )}{" "}
          {activeTab === "delivery" && (
            <div className="tab-pane">
              {getDeliveryTabContent(product)}
            </div>
          )}
          {activeTab === "warranty" && (
            <div className="tab-pane">
              {warrantyAndReturnContent}
            </div>
          )}
        </div>
      </div>

      {product.reviews && product.reviews.length > 0 && (
        <div className="reviews pb-40 container">
          <div className="">
            <div className="dflex justify-between mb-30 title-wrapper">
              <h2>Customer Reviews</h2>
              <Button onClick={handleOpenReviewPopup} className="btn btn-white">
                See All
              </Button>
            </div>

            <ReusableSlider
              items={product.reviews || []}
              slidesToShow={4}
              slidesToScroll={1}
              infinite={false}
              arrows={true}
              gap={20}
              speed={0}
              pauseOnHover={true}
              renderItem={(review) => (
                <ReviewCard key={review.id} review={review} />
              )}
            />
          </div>
        </div>
      )}
      {showReviewPopup && (
        <ReviewPopup
          reviews={product.reviews || []}
          reviewStats={product.review_stats || null}
          onClose={handleCloseReviewPopup}
        />
      )}
      {popularProducts && popularProducts.length > 0 && (
        <div className=" pb-40">
          <ProductCarousel
            title="Popular Products"
            products={popularProducts.map((product) => {
              const priceInfo = getPriceDetails(product);

              return {
                ...product,
                image:
                  typeof product.image === "string"
                    ? product.image
                    : "/images/image-coming-soon.jpg",
                mainPrice: priceInfo.mainPrice,
                wasPrice: priceInfo.wasPrice,
                showWasPrice: priceInfo.showWasPrice,
                discountPercentage: priceInfo.discountPercentage,
                saveAmount: priceInfo.saveAmount,
              };
            })}
            from="details"
          />{" "}
        </div>
      )}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <div className="pb-70">
          <RecentlyViewed recentlyViewed={recentlyViewed} from="details" />
        </div>
      )}
      {showDeliveryPopup && (
        <DeliveryDetailsPopup
          onClose={closeDeliveryPopup}
          freeShipping={shippingCharge === 0 || !!product.free_shipping}
          handlingTimeDays={Number(product.handling_time_days) || 0}
          fastDelivery={product?.fast_dispatch || false}
          {...(shippingCharge !== null && shippingCharge > 0 && { shippingCharge })}
        />
      )}
    </div>
  );
}
