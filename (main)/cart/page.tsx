"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useGetCartQuery,
  useRemoveFromCartMutation,
  useCheckDeliveryMutation,
  useUpdateCartItemQuantityMutation,
  useValidatePromoCodeMutation,
} from "@/lib/redux/apis/cartApi";

import { toast } from "react-toastify";
import { useFormValidation } from "@/lib/hooks/useFormValidation";
import * as yup from "yup";
import { useMemo, useRef, useState, useEffect } from "react";
import { useGlobalPostcode } from "@/lib/hooks/useGlobalPostcode";
import Button from "@/components/ui/Button";
import "../../../styles/Cart.css";
import { getPriceDetails } from "@/lib/utils/getPriceDetails";
import { getImageUrl } from "@/lib/utils/imageUtils";
import { pincode } from "@/lib/hooks/useYupValidation";
import Loader from "@/components/ui/loaders/Loader";
import GooglePlacesInput from "@/components/ui/AddressAutocomplete";
import { skipToken } from "@reduxjs/toolkit/query";
import { formatPrice } from "@/lib/utils/formatPrice";

// ---------------- SCHEMAS ----------------
const pincodeSchema = yup.object().shape({
  pincode: pincode,
});

const Cart = () => {
  const { postcode, updatePostcode } = useGlobalPostcode();
  const {
    data: cart,
    error,
    isLoading,
    isFetching,
  } = useGetCartQuery(postcode ? { postcode: postcode } : skipToken, {
    refetchOnMountOrArgChange: true,
  });
  const clickLockRef = useRef(false);

  const [removeFromCart, { isLoading: isRemoving }] =
    useRemoveFromCartMutation();
  const [validatePromoCode, { isLoading: isApplyingPromo }] =
    useValidatePromoCodeMutation();
  const [checkDelivery, { isLoading: isCheckingDelivery }] =
    useCheckDeliveryMutation();
  const [updateCartItemQuantity, { isLoading: isUpdating }] =
    useUpdateCartItemQuantityMutation();

  const { formData, formErrors, handleChange, handleSubmit, setFormData } =
    useFormValidation(pincodeSchema, { pincode: postcode || "" });

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoCodeError, setPromoCodeError] = useState<string | null>(null);

  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);

  const [discountAmount, setDiscountAmount] = useState(0);
  const [newTotalPrice, setNewTotalPrice] = useState<number | null>(null);

  // Update form when global postcode changes
  useEffect(() => {
    if (postcode) {
      setFormData(prev => ({ ...prev, pincode: postcode }));
    }
  }, [postcode, setFormData]);






  // Restore promo code from session storage on mount
  useEffect(() => {
    const storedPromoData = sessionStorage.getItem('appliedPromoCode');
    if (storedPromoData) {
      try {
        const promoData = JSON.parse(storedPromoData);
        if (promoData && promoData.code) {
          setAppliedPromoCode(promoData.code);
          setDiscountAmount(promoData.discount_amount);
          setNewTotalPrice(promoData.new_total);
          setPromoCodeInput(promoData.code);
        }
      } catch {
        // ignore malformed stored promo data
      }
    }
  }, []);

  // Recalculate promo discount when cart changes
  useEffect(() => {
    const revalidatePromo = async () => {
      if (!appliedPromoCode || !cart?.total_price || !cart.id) return;

      try {
        const response = await validatePromoCode({
          coupon_code: appliedPromoCode,
          cart_id: cart.id,
          post_code: postcode,
        }).unwrap();

        if (response.is_valid) {
          const { discount_type, discount_value, max_discount } = response;
          let discount = 0;
          if (discount_type === "percentage" && discount_value) {
            discount = (cart.total_price * Number.parseFloat(discount_value)) / 100;
            if (max_discount) {
              discount = Math.min(discount, Number.parseFloat(max_discount));
            }
          } else if (discount_type === "fixed" && discount_value) {
            discount = Number.parseFloat(discount_value);
          }
          const newTotal = Math.max(cart.total_price - discount, 0);

          setDiscountAmount(discount);
          setNewTotalPrice(newTotal);

          const promoData = {
            code: appliedPromoCode,
            discount_amount: discount,
            discount_type,
            discount_value: discount_value || "0",
            original_total: cart.grand_total,
            new_total: newTotal,
            max_discount: max_discount
          };
          sessionStorage.setItem('appliedPromoCode', JSON.stringify(promoData));
          window.dispatchEvent(new Event('promoUpdated'));
        } else {
          // If no longer valid, remove it
          handleRemovePromo();
          toast.info("Promo code no longer applicable.");
        }
      } catch {
        // ignore re-validation error silently
      }
    };

    revalidatePromo();
  }, [cart?.total_price]);

  /* ---------------- MEMOIZED SUBTOTAL ---------------- */
  /*
 const subtotal = useMemo(() => {
   if (!cart?.items) return 0;

   return cart.items.reduce((acc, item) => {
     const productForPriceDetails = {
       price: item.unit_price,
       rrp_price: item.rrp_price_snapshot,
       discount_percentage: item.discount_percentage,
       discounted_price: item.discounted_price,
       oldPrice: item.oldPrice,
       discount: item.discount,
     };
     const { mainPrice } = getPriceDetails(productForPriceDetails);
     return acc + mainPrice * Number(item.quantity);
   }, 0);
 }, [cart]);
 */

  const totalSaveAmount = useMemo(() => {
    if (!cart?.items) return 0;

    const itemSavings = cart.items.reduce((acc, item) => {
      const productForPriceDetails = {
        price: item.unit_price,
        rrp_price: item.rrp_price_snapshot,
        discount_percentage: item.discount_percentage,
        discounted_price: item.discounted_price,
        oldPrice: item.oldPrice,
        discount: item.discount,
      };
      const { saveAmount } = getPriceDetails(productForPriceDetails);
      return acc + saveAmount * Number(item.quantity);
    }, 0);

    const promotionDiscount = cart.items_discount || 0;
    const couponDiscount = discountAmount || 0;

    return itemSavings + promotionDiscount + couponDiscount;
  }, [cart, discountAmount]);

  // ---------------- APPLY PROMO CODE ----------------
  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) {
      setPromoCodeError("Please enter a promo code.");
      toast.error("Please enter a promo code.");
      return;
    }

    if (!cart) {
      setPromoCodeError("Cart not available.");
      toast.error("Cart not available.");
      return;
    }

    if (appliedPromoCode && appliedPromoCode.toLowerCase() === promoCodeInput.trim().toLowerCase()) {
      setPromoCodeError("already applied");
      toast.error("already applied");
      return;
    }

    // try {
    //   setPromoCodeError(null);
    //   const response = await validatePromoCode({
    //     code: promoCodeInput,
    //     cartTotal: cart.total_price,
    //   }).unwrap();
    try {
      setPromoCodeError(null);
      const response = await validatePromoCode({
        coupon_code: promoCodeInput,
        cart_id: cart.id,
        user_id: "", // Optional
        order_id: "", // Optional
        post_code: postcode,
      }).unwrap();

      // const { discount_type, discount_value } = response;

      // Check if coupon is valid
      if (!response.is_valid) {
        setPromoCodeError(response.message || "Invalid coupon code");
        setAppliedPromoCode(null);
        setDiscountAmount(0);
        setNewTotalPrice(null);
        toast.error(response.message || "Invalid coupon code");
        return;
      }

      // Calculate discount
      const { discount_type, discount_value, max_discount } = response;
      let discount = 0;
      // if (discount_type === "percentage") {
      //   discount = (subtotal * discount_value) / 100;
      // } else if (discount_type === "fixed") {
      //   discount = discount_value;
      if (discount_type === "percentage" && discount_value) {
        discount = (cart.total_price * Number.parseFloat(discount_value)) / 100;

        // Apply max discount cap if specified
        if (max_discount) {
          discount = Math.min(discount, Number.parseFloat(max_discount));
        }
      } else if (discount_type === "fixed" && discount_value) {
        discount = Number.parseFloat(discount_value);
      }
      // const newTotal = Math.max(subtotal - discount, 0);
      // Calculate new total: total_price - discount
      const newTotal = Math.max(cart.total_price - discount, 0);

      setAppliedPromoCode(promoCodeInput);
      setDiscountAmount(discount);
      setNewTotalPrice(newTotal);

      // Store promo code data for checkout
      const promoData = {
        code: promoCodeInput,
        discount_amount: discount,
        discount_type,
        discount_value: discount_value || "0",
        original_total: cart.grand_total,
        new_total: newTotal,
        max_discount: max_discount // Store max_discount for recalculation
      };
      sessionStorage.setItem('appliedPromoCode', JSON.stringify(promoData));
      window.dispatchEvent(new Event('promoUpdated'));

      toast.success(response.message || "Coupon applied successfully!");
    } catch (error) {
      setPromoCodeError("Failed to apply promo code.");
      setAppliedPromoCode(null);
      setDiscountAmount(0);
      setNewTotalPrice(null);
      // Clear any stored promo data on error
      sessionStorage.removeItem('appliedPromoCode');
      toast.error("Failed to apply promo code.");
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromoCode(null);
    setDiscountAmount(0);
    setNewTotalPrice(null);
    setPromoCodeInput("");
    sessionStorage.removeItem('appliedPromoCode');
    window.dispatchEvent(new Event('promoUpdated'));
    toast.info("Promo code removed.");
  };

  // ---------------- REMOVE ITEM ----------------
  const handleRemoveItem = async (id: string, variant_id?: string) => {
    if (clickLockRef.current) return;
    clickLockRef.current = true;
    if (isRemoving || isUpdating) return;
    try {
      await removeFromCart({ product_id: id, variant_id }).unwrap();
    } catch {
      toast.error("Failed to remove item.");
    } finally {
      setTimeout(() => {
        clickLockRef.current = false;
      }, 300); // small delay to prevent rapid spam
    }
  };

  useEffect(() => {
    if (cart && cart.items.length === 0) {
      setAppliedPromoCode(null);
      setDiscountAmount(0);
      setNewTotalPrice(null);
      setPromoCodeInput("");

      sessionStorage.removeItem("appliedPromoCode");
      window.dispatchEvent(new Event("promoUpdated"));
    }
  }, [cart]);

  // ---------------- CHECK DELIVERY ----------------
  const handleCheckDelivery = handleSubmit(async (data) => {
    try {
      const response = await checkDelivery(data.pincode).unwrap();
      response.deliverable
        ? toast.success("Delivery available!")
        : toast.error(response.message || "Delivery not available");
    } catch {
      toast.error("Invalid Pincode");
    }
  });

  // Per-item local quantity display (allows user to clear & retype)
  const [localQtyMap, setLocalQtyMap] = useState<Record<string, string>>({});

  // Sync local qty map whenever cart items update from API
  useEffect(() => {
    if (!cart?.items) return;
    setLocalQtyMap((prev) => {
      const next = { ...prev };
      cart.items.forEach((item) => {
        // Only overwrite if there's no pending local edit
        if (next[item.id] === undefined) {
          next[item.id] = String(item.quantity);
        }
      });
      return next;
    });
  }, [cart]);

  // ---------------- QUANTITY DEBOUNCED UPDATE ----------------
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUpdateQuantity = (
    product_id: string,
    quantity: number,
    variant_id?: string,
    item_id?: string
  ) => {
    if (isUpdating || isRemoving) return;
    if (quantity < 1 || Number.isNaN(quantity)) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      // Final safety check against available_stock before API call
      const item = cart?.items.find(i => i.id === item_id);
      const stockLimit = item?.available_stock ?? item?.stock;

      if (stockLimit !== undefined && stockLimit !== null && quantity > stockLimit) {
        toast.error("Requested quantity exceeds available stock", { toastId: "stock-warning" });
        if (item_id != null) {
          setLocalQtyMap((prev) => ({ ...prev, [item_id]: String(stockLimit) }));
        }
        return;
      }

      try {
        await updateCartItemQuantity({ product_id, quantity, variant_id, postcode: postcode }).unwrap();
        // Sync local state back to confirmed server value
        if (item_id != null) {
          const id: string = item_id;
          setLocalQtyMap((prev) => ({ ...prev, [id]: String(quantity) }));
        }
      } catch (err) {
        const error = err as { data?: { message?: string; detail?: string } };
        const errorMessage = error?.data?.message || error?.data?.detail || "Failed to update quantity";
        toast.error(errorMessage);
        if (item_id != null) {
          const id: string = item_id;
          setLocalQtyMap((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }
      }
    }, 800);
  };

  // ---------------- LOADING / EMPTY STATES ----------------
  if (isLoading || isFetching) return <div className="empty-cart"><Loader /></div>;
  if (error || !cart || cart.items.length === 0)
    return <div className="empty-cart">Your cart is empty!</div>;

  const hasShippableItem = cart.items?.some(
    (item) => item.is_shippable === true
  );


  // ---------------- RENDER ----------------
  return (
    <div className="pt-40 pb-70">
      <div className="container">
        <h4 className="mb-24">Shopping Cart</h4>

        <div className="dflex cart-section">
          {/* CART TABLE */}
          <div className="cart table-wrapper">
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ paddingLeft: "50px" }}>Qty.</th>
                  <th>Item Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>

              <tbody>
                {cart.items.map((item) => {
                  const productForPriceDetails = {
                    price: item.unit_price,
                    rrp_price: item.rrp_price_snapshot,
                    discount_percentage: item.discount_percentage,
                    discounted_price: item.discounted_price,
                    oldPrice: item.oldPrice,
                    discount: item.discount,
                  };
                  const { mainPrice, wasPrice, showWasPrice } = getPriceDetails(
                    productForPriceDetails
                  );

                  // const itemSubtotal = mainPrice * Number(item.quantity);
                  const itemSubtotal = item.subtotal ?? (mainPrice * Number(item.quantity));

                  return (
                    <tr key={item.id} className={!item.is_active ? "inactive-item" : ""}>
                      {/* ITEM */}
                      <td data-label="Item" className="item-info">
                        {item.is_active && (item.available_stock === undefined || item.available_stock > 0) ? (
                          <Link href={`/product/${item.unique_code || item.product_id}`}>
                            <Image
                              src={getImageUrl(item)}
                              alt={item.product_name}
                              width={100}
                              height={100}
                            />
                          </Link>
                        ) : (
                          <Image
                            src={getImageUrl(item)}
                            alt={item.product_name}
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
                          {!item.is_active ? (
                            <p className="not-available">Not Available Currently</p>
                          ) : item.available_stock !== undefined && item.available_stock <= 0 ? (
                            <p className="out-of-stock">Out of Stock</p>
                          ) : (
                            <p className="in-stock">In Stock</p>
                          )}
                          {item.shipping_cost === 0 && (
                            <p>Eligible For FREE Shipping</p>
                          )}
                          {/* {item.handling_time_days && (
                            <p>Leaves Warehouse In {item.handling_time_days}-{item.handling_time_days + 1} Days</p>
                          )} */}
                          {item.handling_time_days === 1 ? (
                            "Leaves warehouse in Next business day"
                          ) : (
                            `Leaves warehouse in 1 – ${item.handling_time_days} business days`
                          )}

                          {item.variant_attributes &&
                            item.variant_attributes.length > 0 && (
                              <div className="variant-attributes">
                                {item.variant_attributes.map((attr) => (
                                  <p key={attr.name}>
                                    <strong>{attr.name}: </strong>
                                    {attr.value}
                                  </p>
                                ))}
                              </div>
                            )}
                        </div>
                      </td>

                      {/* QUANTITY */}
                      <td data-label="Qty" className="qty">
                        <div className="qty-num">
                          <Button
                            disabled={
                              isUpdating ||
                              isRemoving ||
                              clickLockRef.current ||
                              !item.is_active ||
                              (item.available_stock !== undefined && item.available_stock <= 0)
                            }
                            className="btn-minus"
                            onClick={() => {
                              if (
                                clickLockRef.current ||
                                isUpdating ||
                                isRemoving ||
                                !item.is_active ||
                                (item.available_stock !== undefined && item.available_stock <= 0)
                              )
                                return;
                              if (item.quantity === 1) {
                                handleRemoveItem(
                                  item.product_id,
                                  item.variant_id
                                );
                              } else {
                                const newQty = item.quantity - 1;
                                setLocalQtyMap((prev) => ({ ...prev, [item.id]: String(newQty) }));
                                handleUpdateQuantity(
                                  item.product_id,
                                  newQty,
                                  item.variant_id,
                                  item.id
                                );
                              }
                            }}
                            debounceDelay={300}
                          >
                            -
                          </Button>
                          <input
                            type="number"
                            onWheel={(e) => e.currentTarget.blur()}
                            min="1"
                            value={localQtyMap[item.id] ?? item.quantity}
                            onChange={(e) => {
                              const raw = e.target.value;
                              // Always update local display immediately
                              setLocalQtyMap((prev) => ({ ...prev, [item.id]: raw }));

                              const value = Number.parseInt(raw);
                              if (Number.isNaN(value) || value < 1) return; // wait for valid input

                              const stockLimit = item.available_stock ?? item.stock;
                              if (
                                stockLimit !== undefined && stockLimit !== null &&
                                value > stockLimit
                              ) {
                                toast.error("No more stock available", { toastId: "stock-warning" });
                                const capped = Math.max(stockLimit, 0);
                                setLocalQtyMap((prev) => ({ ...prev, [item.id]: String(capped) }));
                                if (capped >= 1) {
                                  handleUpdateQuantity(
                                    item.product_id,
                                    capped,
                                    item.variant_id,
                                    item.id
                                  );
                                }
                                return;
                              }

                              handleUpdateQuantity(
                                item.product_id,
                                value,
                                item.variant_id,
                                item.id
                              );
                            }}
                            onBlur={() => {
                              // On blur, if empty / invalid, revert to server quantity
                              const raw = localQtyMap[item.id] ?? "";
                              const value = Number.parseInt(raw);
                              if (Number.isNaN(value) || value < 1) {
                                setLocalQtyMap((prev) => ({ ...prev, [item.id]: String(item.quantity) }));
                              }
                            }}
                            disabled={isUpdating}
                          />

                          <Button
                            disabled={
                              isUpdating ||
                              !item.is_active ||
                              (item.available_stock !== undefined &&
                                item.available_stock <= 0)
                            }
                            className="btn-plus"
                            onClick={() => {
                              const currentLocalQty = Number.parseInt(localQtyMap[item.id] ?? String(item.quantity));
                              const stockLimit = item.available_stock ?? item.stock;
                              if (
                                stockLimit !== undefined && stockLimit !== null &&
                                currentLocalQty >= stockLimit
                              ) {
                                toast.error("No more stock available", { toastId: "stock-warning" });
                                return;
                              }
                              const newQty = (Number.isNaN(currentLocalQty) ? item.quantity : currentLocalQty) + 1;
                              setLocalQtyMap((prev) => ({ ...prev, [item.id]: String(newQty) }));
                              handleUpdateQuantity(
                                item.product_id,
                                newQty,
                                item.variant_id,
                                item.id
                              );
                            }}
                          >
                            +
                          </Button>

                        </div>
                      </td>

                      {/* PRICE */}
                      <td data-label="Item Price" className="price">
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <div className="flex">
                            <span className="price">${formatPrice(mainPrice)}</span>
                            {showWasPrice && (
                              <span
                                className=" old-price"
                                style={{
                                  textDecoration: "line-through",
                                  marginRight: "5px",
                                }}
                              >
                                ${formatPrice(wasPrice)}
                              </span>
                            )}
                          </div>
                          {item.promotion_discount != null && item.promotion_discount > 0 && (
                            <span
                              style={{
                                display: "inline-block",
                                marginTop: "6px",
                                backgroundColor: "#fff4f4",
                                color: "#e53e3e",
                                border: "1px solid #fed7d7",
                                borderRadius: "4px",
                                padding: "2px 8px",
                                fontSize: "12px",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                              }}
                            >
                              🏷 Item Discount: ${formatPrice(item.promotion_discount)}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* SUBTOTAL */}
                      <td data-label="Subtotal" className="subtotal">
                        <span className="price">
                          ${formatPrice(item.final_price ?? itemSubtotal)}
                        </span>
                        <Link
                          href="#"
                          className="remove"
                          onClick={() =>
                            handleRemoveItem(item.product_id, item.variant_id)
                          }
                        >
                          Remove
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="order-summary">
            <h5 className="mb-20">Order Summary</h5>

            <div className="summary-row">
              <span>
                Subtotal ({cart.items
                  .filter(i => i.is_active && (i.available_stock === undefined || i.available_stock > 0))
                  .reduce((a, i) => a + i.quantity, 0)}{" "}
                Items)
              </span>
              <p className="price">${formatPrice(cart.subtotal ?? cart.items_total)}</p>
            </div>


            {hasShippableItem && <div className="summary-row">
              <span>Shipping Charges</span>
              <p>${formatPrice(cart.shipping || 0)}</p>
            </div>}

            {cart.taxes && cart.taxes.length > 0 && cart.taxes.map((tax) => (
              <div key={tax.name} className="summary-row">
                <span>{tax.name} ({tax.rate}%)</span>
                <p className="price">${formatPrice(Number.parseFloat(tax.amount))}</p>
              </div>
            ))}

            {/* COUPON DISCOUNT */}
            {appliedPromoCode && discountAmount > 0 && (
              <div className="summary-row">
                <span>
                  Coupon Discount ({appliedPromoCode})
                  <button
                    style={{ marginLeft: "1rem" }}
                    onClick={handleRemovePromo}
                    className="ml-2 text-red-500 text-xs hover:underline"
                  >
                    Remove
                  </button>
                </span>
                <p className="price text-green-600">
                  -${formatPrice(discountAmount)}
                </p>
              </div>
            )}

            {/* PROMO */}
            <div className="promo">
              <input
                type="text"
                placeholder="Promo Code"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
              />
              <button className="cursor-pointer" onClick={handleApplyPromoCode} disabled={isApplyingPromo}>
                {isApplyingPromo ? "Applying..." : "Apply"}
              </button>
            </div>

            {promoCodeError && <p className="error" style={{ marginTop: "0" }}>{promoCodeError}</p>}
            {appliedPromoCode && (
              <p className="success">
                Promo &quot;{appliedPromoCode}&quot; applied!
              </p>
            )}

            <div className="total-row">
              <strong>Total (Incl. GST)</strong>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 'auto' }}>
                {totalSaveAmount > 0 && (
                  <p className="price old-price" style={{ textDecoration: "line-through", fontSize: "14px", color: "#999", marginBottom: 0 }}>
                    ${formatPrice((newTotalPrice !== null ? newTotalPrice : cart.total_price) + totalSaveAmount)}
                  </p>
                )}
                <p className="price">
                  ${formatPrice(newTotalPrice !== null ? newTotalPrice : cart.total_price)}
                </p>
              </div>
            </div>
            {totalSaveAmount > 0 && (
              <div className="summary-row">
                <span>You Saved</span>
                <p className="price text-green-600">
                  -${formatPrice(totalSaveAmount)}
                </p>
              </div>
            )}
            {/* Removed Total Saved as per request */}


            {/* PINCODE CHECK */}
            {/* <div className="promo">
              <GooglePlacesInput
                mode="pincode"
                placeholder="Enter Pincode"
                value={formData.pincode}
                onPlaceSelect={(data) => {
                  console.log(data, "data")
                  if (!data.pincode) {
                    toast.error("Please select a valid pincode");
                    return;
                  }

                  // Update form value (keeps Yup + submit working)
                  handleChange({
                    target: {
                      name: "pincode",
                      value: data.pincode,
                    },
                  } as React.ChangeEvent<HTMLInputElement>);
                  updatePostcode(data.pincode, data.city || "Melbourne");
                }}
              />

              <button
                onClick={handleCheckDelivery}
                disabled={isCheckingDelivery}
              >
                {isCheckingDelivery ? "Checking..." : "Check Delivery"}
              </button>
            </div> */}


            {formErrors.pincode && (
              <p className="error">{formErrors.pincode}</p>
            )}

            {/* PAYMENT ICONS */}
            <div className="paymnet-method">
              <h5 className="mt-30">Secure ways to pay</h5>
              <div className="payment-logos">
                {[
                  "visa",
                  "payment",
                  "american",
                  "paypal",
                  "afterpay",
                  "zip",
                ].map((img) => (
                  <div key={img} className="payment-img">
                    <Image
                      src={`/images/${img}.svg`}
                      alt={img}
                      width={60}
                      height={40}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Link href="/checkout">
              <Button
                className="btn btn-red btn-filled btn-sharp"
                debounceDelay={500}
              >
                Checkout
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div >
  );
};

export default Cart;
