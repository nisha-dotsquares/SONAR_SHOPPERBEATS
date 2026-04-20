"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import "../../styles/Checkout.css";
import { useFormValidation } from "@/lib/hooks/useFormValidation";
import * as yup from "yup";
import { useCreateOrderMutation } from "@/lib/redux/apis/orderApi";
import {
  useClearCartMutation,
  useGetCartQuery,
} from "@/lib/redux/apis/cartApi";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { getPriceDetails } from "@/lib/utils/getPriceDetails";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import { formatPrice } from "@/lib/utils/formatPrice";
import getEstimatedDeliveryRange from "@/lib/utils/getEstimatedDeliveryRange";
import Button from "@/components/ui/Button";
import { useGetAddressesQuery } from "@/lib/redux/apis/addressApi";
import { CartItem, PromoData } from "@/types/cart";
import { Address } from "@/types/address";
import { getImageUrl } from "@/lib/utils/imageUtils";
import { RootState } from "@/lib/redux/store";
import { useSelector } from "react-redux";
import { useGetUserDetailsQuery } from "@/lib/redux/apis/authApi";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  email,
  nameField,
  phoneNumber,
  pincode,
  requiredString,
} from "@/lib/hooks/useYupValidation";
import { useInitiatePaymentMutation } from "@/lib/redux/apis/paymentApi";
import OrderSummaryPopup, { OrderDetails } from "../ui/OrderSummaryPopup";
import { useGlobalPostcode } from "@/lib/hooks/useGlobalPostcode";
import Loader from "../ui/loaders/Loader";


const validationSchema = yup.object({
  email: email,
  firstName: nameField("First Name"),
  lastName: nameField("Last Name"),
  company: yup.string(),
  address: requiredString("Address"),
  apartment: yup.string(),
  city: requiredString("City"),
  state: requiredString("State"),
  postcode: pincode,
  phone: phoneNumber,
  paymentMethod: yup.string().required("Please select a payment method"),
  country: requiredString("Country"),
  useShippingAddressAsBilling: yup.boolean(),

  // BILLING FIELDS ONLY IF NOT USING SHIPPING ADDRESS

  billingCountry: yup
    .string()
    .trim()
    .when("useShippingAddressAsBilling", (val, schema) => {
      return !val[0] ? requiredString("Country") : schema;
    }),
  billingFirstName: yup
    .string()
    .trim()
    .when("useShippingAddressAsBilling", (val, schema) => {
      return !val[0] ? nameField("First Name") : schema;
    }),

  billingLastName: yup
    .string()
    .trim()
    .when("useShippingAddressAsBilling", (val, schema) => {
      return !val[0] ? nameField("Last name") : schema;
    }),

  billingCompany: yup.string(),

  billingAddress: yup
    .string()
    .trim()
    .when("useShippingAddressAsBilling", (val, schema) => {
      return !val[0] ? requiredString("Address") : schema;
    }),

  billingApartment: yup.string(),

  billingCity: yup
    .string()
    .trim()
    .when("useShippingAddressAsBilling", (val, schema) => {
      return !val[0] ? requiredString("City") : schema;
    }),

  billingState: yup
    .string()
    .trim()
    .when("useShippingAddressAsBilling", (val, schema) => {
      return !val[0] ? requiredString("State") : schema;
    }),

  billingPostcode: yup
    .string()
    .trim()
    .when("useShippingAddressAsBilling", (val, schema) => {
      return !val[0] ? pincode : schema;
    }),

  billingPhone: yup
    .string()
    .trim()
    .when("useShippingAddressAsBilling", (val, schema) => {
      return !val[0] ? phoneNumber : schema;
    }),
  buyNote: yup.string().max(500, "Note too long").optional(),
});

export default function SecureCheckout() {
  const { postcode } = useGlobalPostcode();
  const [debouncedPostcode, setDebouncedPostcode] = useState(postcode);

  const {
    data: cart,
    error,
    isLoading,
    isFetching,
  } = useGetCartQuery(debouncedPostcode ? { postcode: debouncedPostcode } : undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [createOrder, { isLoading: isCreatingOrder }] =
    useCreateOrderMutation();
  const [clearCart] = useClearCartMutation();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [shippingAddressValid, setShippingAddressValid] = useState(false);
  const [billingAddressValid, setBillingAddressValid] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    orderId: "",
    deliveryCost: "$0.00",
    totalAmount: "$0.00",
    products: [],
  });
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  // Fetch user details - capture data
  const { data: userDetails } = useGetUserDetailsQuery(undefined, {
    skip: !isAuthenticated,
  });

  const router = useRouter();
  const pathname = usePathname();

  // Redirect if not authenticated
  useEffect(() => {
    if (isAuthenticated === false) {
      setIsRedirecting(true);
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`/login?redirect=${returnUrl}`);
    }
  }, [isAuthenticated, router, pathname]);

  // Redirect to cart if empty and not processing payment
  useEffect(() => {
    if (!isLoading && !isFetching && cart && (!cart.items || cart.items.length === 0) && !isProcessingPayment && !isPopupOpen) {
      router.replace("/cart");
    }
  }, [isLoading, isFetching, cart, isProcessingPayment, isPopupOpen, router]);

  // Handle back button from external payment gateways (Afterpay, Zip, PayPal)
  useEffect(() => {
    if (sessionStorage.getItem('orderId')) {
      // User came back from an external payment gateway, clear the session details to prevent loop
      sessionStorage.removeItem('orderId');
      sessionStorage.removeItem('orderProducts');
      sessionStorage.removeItem('orderAmount');
      sessionStorage.removeItem('deliveryCost');
      router.replace("/cart");
    }
  }, [router]);

  const { data: savedAddresses = [] } =
    useGetAddressesQuery(undefined, {
      skip: !isAuthenticated, // only fetch if logged in
    });

  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null
  );
  const stripe = useStripe();
  const elements = useElements();
  // const pathname = usePathname(); // Moved up
  const checkoutProducts: CartItem[] = useMemo(() => {
    // Cart flow
    return (cart?.items || []).filter(
      (item) =>
        item.is_active &&
        (item.available_stock === undefined || item.available_stock > 0)
    );
  }, [cart]);

  const maxHandlingDays = useMemo(() => {
    if (checkoutProducts.length === 0) return 0;
    return Math.max(
      ...checkoutProducts.map((item) => item.handling_time_days || 0),
      0
    );
  }, [checkoutProducts]);

  const shippingLocation = useMemo(() => {
    const locations = checkoutProducts
      .map((item) => item.ships_from_location)
      .filter(Boolean);
    if (locations.includes("China") || locations.includes("USA")) return "China";
    if (locations.includes("SBAU") || locations.includes("Local 3PL"))
      return "SBAU";
    return locations[0] || "SBAU";
  }, [checkoutProducts]);

  const estimatedDeliveryRange = getEstimatedDeliveryRange(shippingLocation, maxHandlingDays);

  const { formData, formErrors, handleChange, handleSubmit, setFormData, setFormErrors } =
    useFormValidation(validationSchema, {
      email: "",
      firstName: "",
      lastName: "",
      company: "",
      address: "",
      apartment: "",
      city: "",
      state: "",
      postcode: "",
      phone: "",
      cardNumber: "", // Example card number
      expirationDate: "", // Example expiration date (MM/YY)
      securityCode: "", // Example security code
      cardholderName: "",
      useShippingAddressAsBilling: true, // Default to true for simplicity
      billingFirstName: "",
      billingLastName: "",
      billingCompany: "",
      billingAddress: "",
      billingApartment: "",
      billingCity: "",
      billingState: "",
      billingPostcode: "",
      billingPhone: "",
      paymentMethod: "",
      country: "Australia",
      billingCountry: "",
      buyNote: "",
    });

  useEffect(() => {
    if (!postcode) return;

    setFormData((prev) => ({
      ...prev,
      postcode,
    }));
  }, [postcode]);

  // Pre-fill email from user details
  useEffect(() => {
    if (userDetails?.response?.email) {
      setFormData((prev) => ({
        ...prev,
        email: userDetails.response.email,
      }));
    }
  }, [userDetails, setFormData]);


  useEffect(() => {
    if (!useSavedAddress || !selectedAddressId) return;

    const address = savedAddresses.find(
      (addr: Address) => addr.id === selectedAddressId
    );

    if (!address) return;

    setFormData((prev) => ({
      ...prev,
      address: address.address,
      firstName: address.first_name,
      lastName: address.last_name,
      apartment: "",
      city: address.city,
      state: address.state,
      postcode: address.pincode,
      country: address.country,
      phone: address.phone_number || prev.phone,
    }));
  }, [useSavedAddress, selectedAddressId, savedAddresses, setFormData]);

  const handlePayNow = handleSubmit(async (data) => {
    if (isCreatingOrder || isProcessingPayment) return;

    setIsProcessingPayment(true);
    const hasNonShippableItem = checkoutProducts.some(
      (item) => item.is_shippable === false
    );

    if (hasNonShippableItem) {
      toast.error(
        "One or more items in your cart cannot be shipped to this location. Please remove them to continue."
      );
      return;
    }

    // Add check for inactive or out-of-available_stock items
    const hasUnavailableItem = checkoutProducts.some(
      (item) => !item.is_active || (item.available_stock !== undefined && item.available_stock <= 0)
    );

    if (hasUnavailableItem) {
      toast.error(
        "One or more items in your cart are currently unavailable or out of available_stock. Please remove them to continue."
      );
      return;
    }

    // Get promo code data from sessionStorage
    const storedPromoData = sessionStorage.getItem('appliedPromoCode');
    let promoData: PromoData | null = null;
    if (storedPromoData) {
      try {
        promoData = JSON.parse(storedPromoData) as PromoData;
      } catch {
        // ignore malformed promo data
      }
    }

    try {
      // 1️ Validate shipping address
      if (!shippingAddressValid) {
        setIsProcessingPayment(false);
        toast.error("Please enter a valid address");
        return;
      }

      // 2️ Validate billing address (if different)
      if (!data.useShippingAddressAsBilling && !billingAddressValid) {
        setIsProcessingPayment(false);
        toast.error("Please enter a valid billing address");
        return;
      }

      // 3️ Validate payment method
      if (
        formData.paymentMethod !== "CreditCard" &&
        formData.paymentMethod !== "paypal" &&
        formData.paymentMethod !== "afterpay" &&
        formData.paymentMethod !== "zip"
      ) {
        setIsProcessingPayment(false);
        toast.error("Please select a payment method");
        return;
      }

      // 4️ Stripe readiness check
      if (
        formData.paymentMethod === "CreditCard" &&
        (!stripe || !elements)
      ) {
        setIsProcessingPayment(false);
        toast.error("Stripe is not ready");
        return;
      }

      // 5️ Validate cart
      if (checkoutProducts.length === 0) {
        setIsProcessingPayment(false);
        toast.error("No items to checkout.");
        return;
      }

      // Order total limit check
      const promoDataForCheck = (() => {
        try {
          const stored = sessionStorage.getItem('appliedPromoCode');
          return stored ? JSON.parse(stored) : null;
        } catch { return null; }
      })();
      const checkTotal = (promoDataForCheck ? promoDataForCheck.new_total : (cart?.subtotal ?? 0)) + (cart?.shipping ?? 0);
      if (checkTotal >= 50000) {
        setIsProcessingPayment(false);
        toast.error("Orders of $50,000 or more cannot be placed in a single transaction. Please reduce your cart total and try again.");
        return;
      }

      if (checkTotal <= 0) {
        setIsProcessingPayment(false);
        toast.error("Total amount cannot be $0.00.");
        return;
      }


      if (formData.paymentMethod === "CreditCard") {
        const cardElement = elements?.getElement(CardElement);

        if (!cardElement) {
          setIsProcessingPayment(false);
          toast.error("Card details not found");
          return;
        }

        // Keep your submit validation (if you are using PaymentElement)
        if (elements?.submit) {
          const { error } = await elements.submit();
          if (error) {
            setIsProcessingPayment(false);
            toast.error(error.message || "Invalid card details");
            return;
          }
        }
      }


      // 6️ Calculate subtotal
      const calculatedSubtotal = cart?.total_price ?? 0;

      // Apply promo code discount if available
      const finalTotal = calculatedSubtotal - (promoData?.discount_amount ?? 0);
      const promoDiscount = promoData ? promoData.discount_amount : 0;
      const shippingCost = cart?.shipping || 0;

      // 7️ Create order (PENDING PAYMENT)
      const orderData = {
        warehouse_id: "warehouse-123",
        courier: "",
        tracking_number: "",
        buyer_note: data.buyNote,
        max_handling_days: maxHandlingDays,
        estimated_delivery_range: estimatedDeliveryRange,

        subtotal: calculatedSubtotal,
        shipping_cost: shippingCost,
        tax_amount: 0,
        total_amount: finalTotal,
        items_count: checkoutProducts.length,
        total_saving: totalSaveAmount,
        source: "web",
        currency: "AUD",
        customer_name: `${data.firstName} ${data.lastName}`,
        customer_email: data.email,
        customer_phone: String(data.phone),

        // Add promo code information
        ...(promoData && {
          coupon_code: promoData.code,
          discount_amount: promoDiscount,
          coupon_type: promoData.discount_type,
          discount_value: promoData.discount_value,
        }),

        shipping_same_as_billing: data.useShippingAddressAsBilling,

        shipping: {
          first_name: data.firstName,
          last_name: data.lastName,
          company: data.company,
          address: data.address,
          apartment: data.apartment,
          city: data.city,
          state: data.state,
          country: data.country || "AUS",
          postal_code: String(data.postcode),
          phone: String(data.phone),
        },

        billing: data.useShippingAddressAsBilling
          ? {
            first_name: data.firstName,
            last_name: data.lastName,
            company: data.company,
            address: data.address,
            apartment: data.apartment,
            city: data.city,
            state: data.state,
            country: data.country || "AUS",
            postal_code: String(data.postcode),
            phone: String(data.phone),
          }
          : {
            first_name: data.billingFirstName,
            last_name: data.billingLastName,
            company: data.billingCompany,
            address: data.billingAddress,
            apartment: data.billingApartment,
            city: data.billingCity,
            state: data.billingState,
            country: data.billingCountry || "AUS",
            postal_code: data.billingPostcode,
            phone: data.billingPhone,
          },

        payment_method: {
          // payment_gateway:"stripe",
          type:
            formData.paymentMethod === "CreditCard"
              ? "CARD"
              : formData.paymentMethod === "afterpay"
                ? "afterpay_clearpay"
                : formData.paymentMethod === "zip"
                  ? "zip"
                  : "PAYPAL",
          provider:
            formData.paymentMethod === "CreditCard"
              ? "stripe"
              : formData.paymentMethod === "afterpay"
                ? "stripe"
                : formData.paymentMethod === "zip"
                  ? "stripe"
                  : "paypal",
        },

        items: checkoutProducts.map((item) => ({
          product_id: item.product_id,
          sku: item.sku || null,
          unique_code: item.unique_code || null,
          variant_id: item.variant_id,
          variant_attributes: item.variant_attributes,
          name: item.product_name,
          tags: item.tags,
          quantity: item.quantity,
          unit_price: Number(
            item.unit_price ?? item.rrp_price_snapshot ?? 0
          ),
          total_price:
            Number(item.unit_price ?? item.rrp_price_snapshot ?? 0) *
            item.quantity,
          image: getImageUrl(item),
          vendor_id: item.vendor_id,
          ships_from_location: item.ships_from_location || null,
          ean_code: item.ean_code || null,
          handling_time_days: item.handling_time_days || 0,
          supplier: item.supplier || null,
          brand: item.brand || null,
        })),
      };

      const orderResult = await createOrder(orderData).unwrap();

      // 6️ Initiate payment
      // const paymentResult = await initiatePayment({
      //   order_id: orderResult.id,
      //   provider:
      //     formData.paymentMethod === "CreditCard"
      //       ? "stripe"
      //       : "paypal",
      // }).unwrap();

      // 7️ PayPal redirect
      if (formData.paymentMethod === "paypal") {
        if (orderResult.approval_url) {
          // Store order details for PayPal return
          const productsForPopup = checkoutProducts.map((item) => ({
            id: String(item.id),
            name: item.product_name,
            price: `$${formatPrice(Number(
              item.unit_price ?? item.rrp_price_snapshot ?? 0
            ))}`,
            quantity: item.quantity,
            image: getImageUrl(item),
          }));

          sessionStorage.setItem('orderId', orderResult.order_id);
          sessionStorage.setItem('orderNumber', orderResult.order_number || '');
          sessionStorage.setItem('orderProducts', JSON.stringify(productsForPopup));
          sessionStorage.setItem(
            'orderAmount',
            `$${formatPrice(finalTotal)}`
          );
          sessionStorage.setItem('deliveryCost', `$${formatPrice(orderResult.shipping_cost || 0)}`);

          // Clear promo code data after successful order creation
          sessionStorage.removeItem('appliedPromoCode');
          window.location.replace(orderResult.approval_url);
          return;
        }
        setIsProcessingPayment(false);
        toast.error("PayPal initiation failed");
        return;
      }

      // 8️ Afterpay/Zip payment confirmation
      if (formData.paymentMethod === "afterpay" || formData.paymentMethod === "zip") {
        // Store order details for Stripe return (same as PayPal)
        const productsForPopup = checkoutProducts.map((item) => ({
          id: String(item.id),
          name: item.product_name,
          price: `$${formatPrice(Number(
            item.unit_price ?? item.rrp_price_snapshot ?? 0
          ))}`,
          quantity: item.quantity,
          image: getImageUrl(item),
        }));

        sessionStorage.setItem('orderId', orderResult.order_id);
        sessionStorage.setItem('orderNumber', orderResult.order_number || '');
        sessionStorage.setItem('orderProducts', JSON.stringify(productsForPopup));
        sessionStorage.setItem(
          'orderAmount',
          `$${formatPrice(finalTotal)}`
        );
        sessionStorage.setItem('deliveryCost', `$${formatPrice(orderResult.shipping_cost || 0)}`);

        // Clear promo code data after successful order creation
        sessionStorage.removeItem('appliedPromoCode');
        const result = await stripe?.confirmPayment({
          clientSecret: orderResult.client_secret,
          confirmParams: {
            return_url: window.location.origin + "/order-status?status=success",
            payment_method_data: {
              type: formData.paymentMethod === "afterpay" ? "afterpay_clearpay" : "zip",
              billing_details: {
                name: `${data.firstName} ${data.lastName}`,
                email: data.email,
              },
            },
          } as Parameters<NonNullable<typeof stripe>["confirmPayment"]>[0]["confirmParams"],
          redirect: "if_required",
        });

        if (result?.error) {
          setIsProcessingPayment(false);
          toast.error(result.error.message || "Payment failed");
        }
        return;
      }

      // 9️ Stripe confirmation
      const cardElement = elements?.getElement(CardElement);
      if (!cardElement) {
        toast.error("Card details not found");
        return;
      }

      const stripeResult = await stripe?.confirmCardPayment(
        orderResult.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: formData.cardholderName,
              email: formData.email,
            },
          },
        }
      );

      if (stripeResult?.error) {
        setIsProcessingPayment(false);
        toast.error(stripeResult.error.message || "Payment failed");
        return;
      }

      if (stripeResult?.paymentIntent?.status === "succeeded") {
        toast.success("Payment successful!");

        // Clear cart
        if (cart?.id) {
          await clearCart({ cartId: cart.id }).unwrap();
        }

        // Show modal for credit card payments
        const productsForPopup = checkoutProducts.map((item) => ({
          id: String(item.id),
          name: item.product_name,
          price: `$${formatPrice(Number(
            item.unit_price ?? item.rrp_price_snapshot ?? 0
          ))}`,
          quantity: item.quantity,
          image: getImageUrl(item),
        }));

        setOrderDetails({
          orderId: orderResult.order_id,
          orderNumber: orderResult.order_number,
          deliveryCost: `$${formatPrice(orderResult.shipping_cost || 0)}`,
          totalAmount: `$${formatPrice(finalTotal)}`,
          products: productsForPopup,
        });

        // Clear promo code data after successful order creation
        sessionStorage.removeItem('appliedPromoCode');

        setIsPopupOpen(true);
      }
    } catch {
      toast.error("Failed to place order");
    } finally {
      setIsProcessingPayment(false);
    }
  });


  const handleClosePopup = () => {
    setIsPopupOpen(false);
    router.replace("/");
  };

  const orderSummary = checkoutProducts;
  const calculatedSubtotal = cart?.total_price ?? 0;


  const totalSaveAmount = useMemo(() => {
    if (orderSummary.length === 0) return 0;

    const itemSavings = orderSummary.reduce((acc, item) => {
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

    const promotionDiscount = cart?.items_discount || 0;

    return itemSavings + promotionDiscount;
  }, [orderSummary, cart]);

  // Get promo code data for display
  const [promoData, setPromoData] = useState<PromoData | null>(null);
  useEffect(() => {
    const storedPromoData = sessionStorage.getItem('appliedPromoCode');
    if (storedPromoData) {
      try {
        setPromoData(JSON.parse(storedPromoData) as PromoData);
      } catch {
        // ignore malformed promo data
      }
    }
  }, []);

  const finalTotal = calculatedSubtotal - (promoData?.discount_amount ?? 0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce postcode from formData
  useEffect(() => {
    const effectivePostcode = formData.postcode || postcode;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (effectivePostcode && effectivePostcode.length === 4) {
      timerRef.current = setTimeout(() => {
        setDebouncedPostcode(effectivePostcode);
      }, 600);
    } else {
      setDebouncedPostcode("");
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [formData.postcode, postcode]);

  if (!mounted || !isAuthenticated || isRedirecting) {
    return <Loader />;
  }

  return (
    <div className="pt-40 pb-70">
      <div className="container dflex">
        <div className="checkout-wrapper">
          {/* EXPRESS CHECKOUT */}
          {/* <div className="express-checkout">
            <h6 className="align-center">Express Checkout</h6>
            <div className="express-buttons dflex">
              <Button className="paypal">
                <img src="/images/paypal.svg" alt="Paypal" />
              </Button>
              <Button className="afterpar">
                <img src="/images/afterpaylight.svg" alt="Afterpay" />
              </Button>
              <Button className="zip">
                <img src="/images/ziplight.svg" alt="Zippay" />
              </Button>
            </div>
          </div> */}

          {/* <div className="divider">
            <span>OR</span>
          </div> */}

          {/* FORM START */}
          <CheckoutForm
            formData={formData}
            formErrors={formErrors}
            handleChange={handleChange}
            handlePayNow={handlePayNow}
            setFormData={setFormData}
            isCreatingOrder={isCreatingOrder || isProcessingPayment}
            /*  SAVED ADDRESS PROPS */
            useSavedAddress={useSavedAddress}
            setUseSavedAddress={setUseSavedAddress}
            savedAddresses={savedAddresses}
            selectedAddressId={selectedAddressId}
            setSelectedAddressId={setSelectedAddressId}
            setFormErrors={setFormErrors}
            onShippingAddressValid={setShippingAddressValid}
            onBillingAddressValid={setBillingAddressValid}
          />
          {/* FORM END */}
        </div>

        {/* ORDER SUMMARY */}
        <div className="order-summary order-wrapper">
          {isLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "400px",
              }}
            >
              <Loader />
            </div>
          ) : (
            <>
              {!isAuthenticated && (
                <p>
                  Already have an account?{" "}
                  <Link
                    href={`/login?redirect=${encodeURIComponent(pathname)}`}
                  >
                    Sign in
                  </Link>
                </p>
              )}

              <div className="order-title dflex justify-between">
                <h6>Order Summary</h6>
                <a href="/cart">Edit Cart</a>
              </div>

              {orderSummary.map((item) => {
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

                const isInactive = !item.is_active;
                const isOutOfStock =
                  item.available_stock !== undefined &&
                  item.available_stock <= 0;
                const isNotShippable = item.is_shippable === false;

                const isUnavailable =
                  isInactive || isOutOfStock || isNotShippable;

                return (
                  <div
                    key={item.id}
                    className="summary-row"
                    style={{
                      opacity: isUnavailable ? 0.5 : 1,
                      position: "relative",
                    }}
                  >
                    <div className="cart-img">
                      {item.images && (
                        <img src={getImageUrl(item)} alt={item.product_name} />
                      )}
                      <p>
                        {item.product_name}
                        {isUnavailable && (
                          <span
                            style={{
                              color: "red",
                              fontSize: "12px",
                              display: "block",
                              marginTop: "4px",
                            }}
                          >
                            {isInactive && "Not Available Currently"}
                            {isOutOfStock && "Out of Stock"}
                            {isNotShippable &&
                              "Not available for this location"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <p>
                        {item.quantity} ×{" "}
                        {showWasPrice && (
                          <span
                            className="price old-price"
                            style={{
                              textDecoration: "line-through",
                              marginRight: "5px",
                              paddingBottom: "0",
                            }}
                          >
                            ${formatPrice(wasPrice)}
                          </span>
                        )}
                        <span className="price">${formatPrice(mainPrice)}</span>
                      </p>
                      {item.promotion_discount != null &&
                        item.promotion_discount > 0 && (
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
                            🏷 Item Discount: $
                            {formatPrice(item.promotion_discount)}
                          </span>
                        )}
                    </div>
                  </div>
                );
              })}

              <div className="summary-row delivery-cost">
                <div>
                  <p>Delivery</p>
                  <span>Shipping cost calculated based on your location</span>
                </div>
                <p className="price">${formatPrice(cart?.shipping || 0)}</p>
              </div>

              {/* PROMO CODE DISCOUNT */}
              {promoData && (promoData.discount_amount ?? 0) > 0 && (
                <div className="summary-row">
                  <span>Coupon Discount ({promoData.code})</span>
                  <p className="price text-green-600">
                    -${formatPrice(promoData.discount_amount ?? 0)}
                  </p>
                </div>
              )}
              {totalSaveAmount > 0 && (
                <div className="summary-row">
                  <span>You Saved</span>
                  <p className="price text-green-600">
                    -{"$"}
                    {formatPrice(
                      totalSaveAmount + (promoData?.discount_amount || 0)
                    )}
                  </p>
                </div>
              )}

              <div className="total-cart">
                <p>Total (incl. GST)</p>
                <div className="price-column">
                  {(totalSaveAmount > 0 ||
                    (promoData && (promoData.discount_amount ?? 0) > 0)) && (
                      <p
                        className="price old-price"
                        style={{
                          textDecoration: "line-through",
                          fontSize: "14px",
                          color: "#999",
                        }}
                      >
                        ${formatPrice(
                          finalTotal +
                          totalSaveAmount +
                          (promoData?.discount_amount || 0)
                        )}
                      </p>
                    )}
                  <p style={{ paddingTop: "0" }} className="price">
                    ${formatPrice(finalTotal)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <OrderSummaryPopup
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        orderDetails={orderDetails}
        isAuthenticated={isAuthenticated}
        from={"checkout"}
      />
    </div>
  );
}
