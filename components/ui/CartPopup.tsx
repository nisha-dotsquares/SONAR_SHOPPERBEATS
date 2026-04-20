


"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useGetCartQuery,
} from "@/lib/redux/apis/cartApi";
import { CartItem, PromoData } from "@/types/cart";
import { useGlobalPostcode } from "@/lib/hooks/useGlobalPostcode";
import { getImageUrl } from "@/lib/utils/imageUtils";
import { skipToken } from "@reduxjs/toolkit/query";
import { formatPrice } from "@/lib/utils/formatPrice";

interface CartPopupProps {
  isVisible: boolean;
}

const CartPopup = ({ isVisible }: CartPopupProps) => {
  const { postcode } = useGlobalPostcode();
  const { data: cartData, isLoading } = useGetCartQuery(
    postcode ? { postcode } : skipToken,
    {
      refetchOnMountOrArgChange: true,
    }
  );


  // Get promo code data for display
  const [promoData, setPromoData] = useState<PromoData | null>(null);

  useEffect(() => {
    const fetchPromoData = () => {
      const storedPromoData = sessionStorage.getItem('appliedPromoCode');
      if (storedPromoData) {
        try {
          setPromoData(JSON.parse(storedPromoData) as PromoData);
        } catch {
          setPromoData(null);
        }
      } else {
        setPromoData(null);
      }
    };

    fetchPromoData();

    // Listen for custom event or visibility change to refresh
    window.addEventListener('promoUpdated', fetchPromoData);
    if (isVisible) fetchPromoData();

    return () => {
      window.removeEventListener('promoUpdated', fetchPromoData);
    };
  }, [isVisible, cartData]);

  const finalTotal = promoData ? promoData.new_total : cartData?.total_price;
  const cartItems: CartItem[] = (cartData?.items ?? []).filter(item => item.is_active && (item.available_stock === undefined || item.available_stock > 0));


  return (
    <div className={`header-link cart ${isVisible ? "is-visible" : ""}`}>
      {/* Cart Icon */}
      <Link href="/cart">
        <Image src="/images/cart.svg" alt="cart" width={24} height={24} />
      </Link>
      {cartItems.length > 0 && (
        <span className="cart-num">{cartItems.length}</span>
      )}

      {/* Cart Popup */}

      <div className="cart-popup">
        <div className="cart-popup-bg">
          <div className="cart-content">
            {isLoading ? (
              <p>Loading...</p>
            ) : cartItems.length > 0 ? (
              cartItems.map((item: CartItem) => (
                <div className="dflex no-wrap" key={item.variant_id || item.product_id}>
                  <Image
                    src={
                      getImageUrl(item)
                    }
                    alt={item.product_name}
                    width={50}
                    height={50}
                  />

                  <div className="cart-desript">
                    <h5>{item.product_name}</h5>
                    <p>x{item.quantity}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="dflex flex-column align-center justify-center py-30 w-100">
                <p>Your cart is empty</p>
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="total-cart">
              <p>Total</p>
              <p className="price">
                ${formatPrice(finalTotal)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartPopup;
