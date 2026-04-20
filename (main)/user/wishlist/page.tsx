

"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  useGetWishlistQuery,
  useRemoveFromWishlistMutation,
  useAddToCartMutation,
  useGetCartQuery,
} from "@/lib/redux/apis/cartApi";
import { toast } from "react-toastify";
import { formatPrice } from "@/lib/utils/formatPrice";
import { VariantAttribute } from "@/types/product";
import { getImageUrl } from "@/lib/utils/imageUtils";
import { useRouter } from "next/navigation";
import { getPriceDetails } from "@/lib/utils/getPriceDetails";
import Button from "@/components/ui/Button";
import { formatReadableDate } from "@/lib/utils/dateUtils";
import { WishlistItem } from "@/types/wishlist";
import Loader from "@/components/ui/loaders/Loader";
import '../../../../styles/Cart.css'
import { useGlobalPostcode } from "@/lib/hooks/useGlobalPostcode";
import { useCalculateShippingMutation } from "@/lib/redux/apis/orderApi";
import { useFormValidation } from "@/lib/hooks/useFormValidation";
import { pincode as pincodeValidation } from "@/lib/hooks/useYupValidation";
import * as yup from "yup";
import { useEffect} from "react";

export default function WishlistPage() {
  const router = useRouter();

  const { data: wishlistData, isLoading } = useGetWishlistQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [removeFromWishlist, { isLoading: isRemoving }] = useRemoveFromWishlistMutation();
  const [addToCart] = useAddToCartMutation();
  const { data: cart } = useGetCartQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const { postcode, updatePostcode } = useGlobalPostcode();
  const [calculateShipping, { isLoading: isCalculatingShipping }] = useCalculateShippingMutation();

  const pincodeSchema = yup.object().shape({
    pincode: pincodeValidation,
  });

  const { formData, formErrors, handleChange, setFormData } =
    useFormValidation(pincodeSchema, { pincode: postcode || "" });

  useEffect(() => {
    if (postcode) {
      setFormData(prev => ({ ...prev, pincode: postcode }));
    }
  }, [postcode, setFormData]);



  const isInCart = (productId: string, variantId?: string) => {
    return cart?.items?.some(
      (c) =>
        c.product_id === productId &&
        (variantId ? c.variant_id === variantId : true)
    );
  };

  const handleAddToCart = async (item: WishlistItem) => {
    if (postcode) {
      try {
        const response = await calculateShipping({
          postcode: postcode,
          product_identifier: item.sku || item.product_id,
        }).unwrap();

        if (response.shipping_cost === "ns" || response.shipping_cost === null) {
          toast.error("Item cannot be shipped to your location.");
          return;
        }
      } catch (err) {
        toast.error("Unable to verify shipping for your location.");
        return; 
      }
    }

    try {
      await addToCart({
        productId: item.product_id,
        quantity: 1,
        variant_id: item.variant_id,
      }).unwrap();
      toast.success("Product added to cart!");
    } catch (err) {
      const error = err as { data?: { message?: string }; error?: string };
      toast.error(error?.data?.message || error?.error || "Failed to add product to cart.");
    }
  };

  const handleRemoveFromWishlist = async (
    productId: string,
    variantId?: string
  ) => {
    if (isRemoving) return;

    try {
      await removeFromWishlist({
        product_id: productId,
        variant_id: variantId,
      }).unwrap();
      toast.success("Item removed from wishlist.");
    } catch {
      toast.error("Failed to remove item from wishlist.");
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!wishlistData?.items || wishlistData.items.length === 0) {
    return (
      <div className="content wishlist-content">
        <h4 className="mb-30">Wishlist</h4>
        <p>Your wishlist is empty.</p>
      </div>
    );
  }



  return (
    <div className="wishlist-content">
      <h4 className="mb-30">Wishlist</h4>
      <table className="cart-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Date Added</th>
            <th>Stock Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {wishlistData.items.map((item: WishlistItem) => {
            const isOutOfStock =
              !item.is_active ||
              (item.available_stock !== undefined &&
                item.available_stock <= 0);

            const itemKey = `${item.product_id}-${item.variant_id ?? 'no-variant'}`;

            return (
              <tr key={itemKey}>
                <td data-label="Product" className="item-info">
                  {item.is_active ? (
                    <Link href={`/product/${item.unique_code || item.product_id}`}>
                      <Image
                        src={getImageUrl(item)}
                        alt={item.product_name|| "Shopperbeats"}
                        width={100}
                        height={100}
                      />
                    </Link>
                  ) : (
                    <Image
                      src={getImageUrl(item)}
                      alt={item.product_name|| "Shopperbeats"}
                      width={100}
                      height={100}
                      style={{ cursor: "not-allowed", opacity: 0.6 }}
                    />
                  )}
                  <div>
                  <h3>
                    {item.is_active ? (
                      <Link href={`/product/${item.unique_code || item.product_id}`}>
                        {item.product_name}
                      </Link>
                    ) : (
                      <span style={{ cursor: "not-allowed", opacity: 0.7 }}>
                        {item.product_name}
                      </span>
                    )}
                  </h3>
                    {item.variant_attributes &&
                      item.variant_attributes.length > 0 && (
                        <div className="variant-attributes">
                          {item.variant_attributes.map(
                            (attr: VariantAttribute) => (
                              <p key={attr.name}>
                                <strong>{attr.name}: </strong>
                                {attr.value}
                              </p>
                            )
                          )}
                        </div>
                      )}
                  </div>
                </td>

                <td data-label="Price" className="price">
                  {(() => {
                    const { mainPrice, wasPrice, hasDiscount } =
                      getPriceDetails(item);

                    return (
                      <>
                        <span className="price">
                          ${formatPrice(mainPrice)}
                        </span>
                        {hasDiscount && (
                          <span className="old-price">
                            ${formatPrice(wasPrice)}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </td>

                <td data-label="Date Added">
                  {item.created_at && (
                    <p>{formatReadableDate(item.created_at)}</p>
                  )}
                </td>

                <td data-label="Stock Status">
                  {!item.is_active ? (
                    <p className="not-available">
                      Not Available Currently
                    </p>
                  ) : item.available_stock !== undefined &&
                    item.available_stock <= 0 ? (
                    <p className="out-of-stock">Out of Stock</p>
                  ) : (
                    <p className="in-stock">In Stock</p>
                  )}
                </td>

                <td data-label="Action">
                  <div className="btn-action">
                    {isOutOfStock ? (
                      <Button
                        disabled
                        className="btn btn-out-of-stock"
                        debounceDelay={0}
                      >
                        Out of Stock
                      </Button>
                    ) : (
                      <Button
                        disabled={isCalculatingShipping}
                        onClick={() =>
                          isInCart(item.product_id, item.variant_id)
                            ? router.push("/cart")
                            : handleAddToCart(item)
                        }
                        className="btn btn-red btn-filled btn-sharp"
                      >
                        {isInCart(item.product_id, item.variant_id)
                          ? "Go to Cart"
                          : "Add to Cart"}
                      </Button>
                    )}

                    {/* REMOVE is always visible */}
                    <Button
                      disabled={isRemoving}
                      isLoading={isRemoving}
                      onClick={() =>
                        handleRemoveFromWishlist(
                          item.product_id,
                          item.variant_id
                        )
                      }
                      className="btn btn-red btn-outline"
                    >
                      Remove
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>

      </table>
    </div>
  );
}

