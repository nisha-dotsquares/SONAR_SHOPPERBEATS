"use client";
import React, { useEffect, useState, useMemo } from "react";
import Button from "@/components/ui/Button";
import AddressAutocomplete from "../ui/AddressAutocomplete";
import { Address } from "@/types/address";
import { CheckoutFormData } from "@/types/order";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useInitiatePaymentMutation } from "@/lib/redux/apis/paymentApi";
import { useCreateOrderMutation } from "@/lib/redux/apis/orderApi";
import { useGetCartQuery, useClearCartMutation } from "@/lib/redux/apis/cartApi";
import { useGlobalPostcode } from "@/lib/hooks/useGlobalPostcode";
import { formatPrice } from "@/lib/utils/formatPrice";
import { handleAustralianPhoneNumberChange } from "@/lib/utils/phoneValidation";
import { skipToken } from "@reduxjs/toolkit/query";
import getEstimatedDeliveryRange from "@/lib/utils/getEstimatedDeliveryRange";


interface CheckoutFormProps {
  formData: CheckoutFormData;
  formErrors: Partial<Record<keyof CheckoutFormData, string>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePayNow: (e: React.FormEvent<HTMLFormElement>) => void;
  setFormData: (data: React.SetStateAction<CheckoutFormData>) => void;
  setFormErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof CheckoutFormData, string>>>>;
  isCreatingOrder: boolean;
  useSavedAddress: boolean;
  setUseSavedAddress: (value: boolean) => void;
  savedAddresses: Address[];
  selectedAddressId: number | null;
  setSelectedAddressId: (id: number | null) => void;
  onShippingAddressValid: (valid: boolean) => void;
  onBillingAddressValid: (valid: boolean) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  formData,
  formErrors,
  handleChange,
  handlePayNow,
  setFormData,
  isCreatingOrder,
  useSavedAddress,
  setUseSavedAddress,
  savedAddresses,
  selectedAddressId,
  setSelectedAddressId,
  setFormErrors,
  onShippingAddressValid,
  onBillingAddressValid,
}) => {
  const { postcode } = useGlobalPostcode();
  const effectivePostcode = formData.postcode || postcode;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name } = e.target;
  const [debouncedPostcode, setDebouncedPostcode] = useState(formData.postcode);
  // Only call the API when postcode length is exactly 4
  const { data: cart } = useGetCartQuery(
    debouncedPostcode.length === 4 ? { postcode: debouncedPostcode } : skipToken,
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const activeProducts = useMemo(() => {
    return (cart?.items || []).filter(
      (item) =>
        item.is_active &&
        (item.available_stock === undefined || item.available_stock > 0)
    );
  }, [cart]);

  const maxHandlingDays = useMemo(() => {
    if (activeProducts.length === 0) return 0;
    return Math.max(
      ...activeProducts.map((item) => item.handling_time_days || 0),
      0
    );
  }, [activeProducts]);

  const shippingLocation = useMemo(() => {
    const locations = activeProducts
      .map((item) => item.ships_from_location)
      .filter(Boolean);
    if (locations.includes("China") || locations.includes("USA")) return "China";
    if (locations.includes("SBAU") || locations.includes("Local 3PL"))
      return "SBAU";
    return locations[0] || "SBAU";
  }, [activeProducts]);

  // Debounce postcode input
  useEffect(() => {
    // Only update debouncedPostcode if exactly 4 digits
    if (effectivePostcode?.length === 4) {
      const timer = setTimeout(() => {
        setDebouncedPostcode(effectivePostcode);
      }, 600); // 600ms debounce
      return () => clearTimeout(timer);
    } else {
      // reset so API will skip
      setDebouncedPostcode("");
    }
  }, [effectivePostcode]);





  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;

    const { value, error } = handleAustralianPhoneNumberChange(
      e,
      formData[name as keyof CheckoutFormData] as string
    );

    // Update the form value
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Update the error state so React re-renders
    setFormErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };


  return (
    <form className="checkout-form" onSubmit={handlePayNow}>
      {/* CONTACT DETAILS */}
      <div className="contact-details">
        <h5>Contact Details</h5>
        <div className="form-item">
          <label htmlFor="email">Email Address*</label>
          <input
            id="email"
            type="text"
            name="email"
            placeholder="Enter Email"
            value={formData.email}
            readOnly
            onChange={handleChange}
          />
          {formErrors.email && <p className="error">{formErrors.email}</p>}
          <div className="mt-18">
            <input type="checkbox" /> Keep me up to date on news and exclusive
            offers via email and text messages
          </div>
        </div>
      </div>

      {/* DELIVERY */}
      <div className="delivery-details mt-30">
        <h5>Delivery</h5>
        {/* USE SAVED ADDRESS */}
        {savedAddresses.length > 0 && (
          <div className="form-item">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useSavedAddress}
                onChange={(e) => {
                  setUseSavedAddress(e.target.checked);
                  setSelectedAddressId(null);
                  if (e.target.checked) onShippingAddressValid(true); 
                  setFormErrors((prev) => ({
                    ...prev,
                    firstName:"",
                    lastName:"",
                    address: "",
                    city: "",
                    state: "",
                    pincode: "",
                    country: "",
                    phone: "",
                  }));
                }}
              />
              Use saved address
            </label>
          </div>
        )}
        {useSavedAddress && (
          <div className="saved-address-list">
            {savedAddresses.map((addr) => {
              const id = addr.id;
              if (id == null) return null;

              return (
                <label
                  key={id}
                  className={`saved-address-card ${selectedAddressId === id ? "active" : ""
                    }`}
                >
                  <input
                    type="radio"
                    name="savedAddress"
                    checked={selectedAddressId === id}
                    onChange={() => setSelectedAddressId(id)}
                  />
                  <strong>{addr.title}</strong>
                  <div className="saved-Address">
                    <p>{addr.address}</p>
                    <small>
                      {addr.city}, {addr.state} {addr.pincode}
                    </small>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <div className="form-item">
          <input
            type="text"
            name="country"
            placeholder="Country"
            value={formData.country}
            onChange={(e) => { handleChange(e); onShippingAddressValid(false); }}
          />
          {formErrors.country && <p className="error">{formErrors.country}</p>}
        </div>

        <div className="form-fields dflex">
          <div className="form-item">
            <label htmlFor="firstName">First name*</label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleChange}
            />
            {formErrors.firstName && (
              <p className="error">{formErrors.firstName}</p>
            )}
          </div>
          <div className="form-item">
            <label htmlFor="lastName">Last name*</label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleChange}
            />
            {formErrors.lastName && (
              <p className="error">{formErrors.lastName}</p>
            )}
          </div>
        </div>

        <div className="form-item">
          <label htmlFor="company">Company (optional)</label>
          <input
            id="company"
            type="text"
            name="company"
            placeholder="Company (optional)"
            value={formData.company}
            onChange={handleChange}
          />
        </div>

        <div className="form-item">
          {!useSavedAddress ? (
            <>
              <label htmlFor="shippingAddress">Address*</label>
              <AddressAutocomplete
                id="shippingAddress"
                placeholder="Address"
                value={formData.address}
                onValidPlace={onShippingAddressValid}
                onChange={(val) => {
                  setFormData((prev: CheckoutFormData) => ({
                    ...prev,
                    address: val,
                  }));
                  setFormErrors((prev) => ({
                    ...prev,
                    address: "",
                  }));
                }}
                onPlaceSelect={(data) => {
                  setFormData((prev: CheckoutFormData) => ({
                    ...prev,
                    address: data.address,
                    city: data.city,
                    state: data.state,
                    postcode: data.pincode,
                    country: data.country,
                  }));

                  setFormErrors((prev) => ({
                    ...prev,
                    address: "",
                    city: "",
                    state: "",
                    postcode: "",
                    country: "",
                  }));
                }}
              />
            </>
          ) : (
            <>
              <label htmlFor="address">Address*</label>
              <input
                id="address"
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
              />
            </>
          )}
          {formErrors.address && <p className="error">{formErrors.address}</p>}
        </div>

        <div className="form-item">
          <label htmlFor="apartment">Apartment, suite, etc. (optional)</label>
          <input
            id="apartment"
            type="text"
            name="apartment"
            placeholder="Apartment, suite, etc. (optional)"
            value={formData.apartment}
            onChange={handleChange}
          />
        </div>

        <div className="form-fields dflex">
          <div className="form-item">
            <label htmlFor="city">City*</label>
            <input
              id="city"
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={(e) => { handleChange(e); onShippingAddressValid(false); }}
            />
            {formErrors.city && <p className="error">{formErrors.city}</p>}
          </div>
          <div className="form-item">
            <label htmlFor="state">State*</label>
            <input
              id="state"
              type="text"
              name="state"
              placeholder="State"
              value={formData.state}
              onChange={(e) => { handleChange(e); onShippingAddressValid(false); }}
            />
            {formErrors.state && <p className="error">{formErrors.state}</p>}
          </div>
          <div className="form-item">
            <label htmlFor="postcode">Postcode*</label>
            <input
              id="postcode"
              onWheel={(e) => e.currentTarget.blur()}
              type="number"
              name="postcode"
              placeholder="Postcode"
              value={formData.postcode}
              onChange={(e) => { handleChange(e); onShippingAddressValid(false); }}
            />
            {formErrors.postcode && (
              <p className="error">{formErrors.postcode}</p>
            )}
          </div>
        </div>

        <div className="form-item">
          <label htmlFor="phone">Phone*</label>
          <input
            id="phone"
            type="text"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handlePhoneChange}
            maxLength={12}
          />

          {formErrors.phone && <p className="error">{formErrors.phone}</p>}
        </div>
      </div>

      {/* SHIPPING METHOD */}
      <div className="shipping-details mt-30">
        <h5>Shipping Method</h5>
        <div className="shipping-details-block">
          <div className="dflex justify-between">
            <p>Shipping</p>
            <p className="price">${formatPrice(cart?.shipping || 0)}</p>
          </div>
          <span>
            {getEstimatedDeliveryRange(shippingLocation, maxHandlingDays)}
          </span>
          <span>Shipping to {formData.postcode || (mounted ? postcode : '')}</span>
        </div>
      </div>

      {/* PAYMENT */}
      <div className="payment-details mt-30">
        <h5>Payment</h5>
        <p>All transactions are secure and encrypted.</p>

        <div className="payment-card">
          <label htmlFor="CreditCard" className="flex items-center gap-2">
            <input
              type="radio"
              name="paymentMethod"
              id="CreditCard"
              value={"CreditCard"}
              checked={formData.paymentMethod === "CreditCard"}
              onChange={handleChange}
            />
            Credit Card
            <div className="payment-logos dflex ml-2">
              <div className="payment-img">
                <img src="/images/visa.svg" alt="Visa" />
              </div>
              <div className="payment-img">
                <img src="/images/payment.svg" alt="Mastercard" />
              </div>
              <div className="payment-img">
                <img src="/images/american.svg" alt="Amex" />
              </div>
            </div>
          </label>

          {formData.paymentMethod === "CreditCard" && (
            <div className="form-item mt-4">
              <div className="label-text" style={{ fontWeight: 600, marginBottom: "8px" }}>Card details</div>
              <div className="stripe-card-element">
                <CardElement
                  options={{
                    hidePostalCode: true,
                    style: {
                      base: {
                        fontSize: "16px",
                        color: "#000",
                        "::placeholder": { color: "#999" },
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}

          <div className="mt-18">
            <input
              type="checkbox"
              name="useShippingAddressAsBilling"
              checked={formData.useShippingAddressAsBilling}
              onChange={(e) =>
                setFormData((prev: CheckoutFormData) => ({
                  ...prev,
                  useShippingAddressAsBilling: e.target.checked,
                }))
              }
            />
            Use shipping address as billing address
          </div>
        </div>

        {!formData.useShippingAddressAsBilling && (
          <div className="delivery-details mt-30">
            <div className="form-item">
              <h5>Billing Address</h5>
            </div>
            <div className="form-item">
              <input
                type="text"
                name="billingCountry"
                placeholder="Country"
                value={formData.billingCountry}
                onChange={(e) => { handleChange(e); onBillingAddressValid(false); }}
              />
              {formErrors.billingCountry && (
                <p className="error">{formErrors.billingCountry}</p>
              )}
            </div>
            <div className="form-fields dflex">
              <div className="form-item">
                <label htmlFor="billingFirstName">First name*</label>
                <input
                  id="billingFirstName"
                  type="text"
                  name="billingFirstName"
                  placeholder="First name"
                  value={formData.billingFirstName}
                  onChange={handleChange}
                />
                {formErrors.billingFirstName && (
                  <p className="error">{formErrors.billingFirstName}</p>
                )}
              </div>
              <div className="form-item">
                <label htmlFor="billingLastName">Last name*</label>
                <input
                  id="billingLastName"
                  type="text"
                  name="billingLastName"
                  placeholder="Last name"
                  value={formData.billingLastName}
                  onChange={handleChange}
                />
                {formErrors.billingLastName && (
                  <p className="error">{formErrors.billingLastName}</p>
                )}
              </div>
            </div>
            <div className="form-item">
              <label htmlFor="billingCompany">Company (optional)</label>
              <input
                id="billingCompany"
                type="text"
                name="billingCompany"
                placeholder="Company (optional)"
                value={formData.billingCompany}
                onChange={handleChange}
              />
            </div>
            <div className="form-item">
              <label htmlFor="billingAddress">Address*</label>
              <AddressAutocomplete
                id="billingAddress"
                placeholder="Address"
                value={formData.billingAddress}
                onValidPlace={onBillingAddressValid}
                onChange={(val) => {
                  setFormData((prev: CheckoutFormData) => ({
                    ...prev,
                    billingAddress: val,
                  }));
                  setFormErrors((prev) => ({
                    ...prev,
                    billingAddress: "",
                  }));
                }}
                onPlaceSelect={(data) => {
                  setFormData((prev: CheckoutFormData) => ({
                    ...prev,
                    billingAddress: data.address,
                    billingCity: data.city,
                    billingState: data.state,
                    billingPostcode: data.pincode,
                    billingCountry: data.country,
                  }));

                  setFormErrors((prev) => ({
                    ...prev,
                    billingAddress: "",
                    billingCity: "",
                    billingState: "",
                    billingPostcode: "",
                    billingCountry: "",
                  }));
                }}
              />
              {formErrors.billingAddress && (
                <p className="error">{formErrors.billingAddress}</p>
              )}
            </div>
            <div className="form-item">
              <label htmlFor="billingApartment">Apartment, suite, etc. (optional)</label>
              <input
                id="billingApartment"
                type="text"
                name="billingApartment"
                placeholder="Apartment, suite, etc. (optional)"
                value={formData.billingApartment}
                onChange={handleChange}
              />
            </div>
            <div className="form-fields dflex">
              <div className="form-item">
                <label htmlFor="billingCity">City*</label>
                <input
                  id="billingCity"
                  type="text"
                  name="billingCity"
                  placeholder="City"
                  value={formData.billingCity}
                  onChange={(e) => { handleChange(e); onBillingAddressValid(false); }}
                />
                {formErrors.billingCity && (
                  <p className="error">{formErrors.billingCity}</p>
                )}
              </div>
              <div className="form-item">
                <label htmlFor="billingState">State*</label>
                <input
                  id="billingState"
                  type="text"
                  name="billingState"
                  placeholder="State"
                  value={formData.billingState}
                  onChange={(e) => { handleChange(e); onBillingAddressValid(false); }}
                />
                {formErrors.billingState && (
                  <p className="error">{formErrors.billingState}</p>
                )}
              </div>
              <div className="form-item">
                <label htmlFor="billingPostcode">Postcode*</label>
                <input
                  id="billingPostcode"
                  onWheel={(e) => e.currentTarget.blur()}
                  type="number"
                  name="billingPostcode"
                  placeholder="Postcode"
                  value={formData.billingPostcode}
                  onChange={(e) => { handleChange(e); onBillingAddressValid(false); }}
                />
                {formErrors.billingPostcode && (
                  <p className="error">{formErrors.billingPostcode}</p>
                )}
              </div>
            </div>
            <div className="form-item">
              <label htmlFor="billingPhone">Phone*</label>
              <input
                id="billingPhone"
                type="tel"
                name="billingPhone"
                placeholder="Phone"
                value={formData.billingPhone}
                onChange={handlePhoneChange}
                maxLength={12}
              />

              {formErrors.billingPhone && (
                <p className="error">{formErrors.billingPhone}</p>
              )}
            </div>
          </div>
        )}

        {/* OTHER PAYMENT OPTIONS */}
        <div className="payment-option">
          <div className="payment-item">
            <input
              type="radio"
              name="paymentMethod"
              id="paypal"
              value="paypal"
              checked={formData.paymentMethod === "paypal"}
              onChange={handleChange}
            />
            <label htmlFor="paypal">Paypal</label>
            <img src="/images/paypal.svg" alt="Paypal" />
          </div>
        </div>
        <div className="payment-option">
          <div className="payment-item">
            <input type="radio" name="paymentMethod" id="afterpay" value="afterpay"
              checked={formData.paymentMethod === "afterpay"}
              onChange={handleChange} />
            <label htmlFor="afterpay">Afterpay</label>
            <img src="/images/afterpay.svg" alt="Afterpay" />
          </div>
        </div>
        <div className="payment-option">
          <div className="payment-item">
            <input type="radio" name="paymentMethod" id="zip" value="zip"
              checked={formData.paymentMethod === "zip"}
              onChange={handleChange} />
            <label htmlFor="zip">Zippay</label>
            <img src="/images/zip.svg" alt="Zippay" />
          </div>
        </div>
        {/* <div className="payment-option">
          <div className="payment-item">
            <input
              type="radio"
              name="paymentMethod"
              id="COD"
              checked={formData.paymentMethod === "COD"}
              onChange={handleChange}
              value="COD"
            />
            <label htmlFor="COD">COD</label>
          </div>
        </div> */}
        {formErrors.paymentMethod && (
          <p className="error">{formErrors.paymentMethod}</p>
        )}
      </div>
      
      <div className="order-note mt-30">
        <h5>Order Note (Optional)</h5>
        <div className="form-item">
          <textarea
            name="buyNote"
            placeholder="Add a note to your order (e.g., special delivery instructions)"
            value={formData.buyNote}
            onChange={(e) => setFormData(prev => ({ ...prev, buyNote: e.target.value }))}
            maxLength={500}
            className="w-100"
            style={{ height: '100px', padding: '10px' }}
          />
          {formErrors.buyNote && <p className="error">{formErrors.buyNote}</p>}
        </div>
      </div>

      <Button
        className="btn btn-red btn-filled btn-sharp w-100"
        type="submit"
        disabled={isCreatingOrder}
        isLoading={isCreatingOrder}
      >
        {isCreatingOrder ? "Placing Order..." : "Pay Now"}
      </Button>
    </form>
  );
};

export default CheckoutForm;
