"use client";
import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { useRetryPaymentMutation } from "@/lib/redux/apis/orderApi";
import { toast } from "react-toastify";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface RetryPaymentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

const RetryPaymentForm: React.FC<RetryPaymentPopupProps> = ({ isOpen, onClose, orderId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [retryPayment] = useRetryPaymentMutation();
  const [paymentMethod, setPaymentMethod] = useState("CreditCard");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (paymentMethod === "CreditCard" && (!stripe || !elements)) {
        toast.error("Stripe is not ready");
        setIsProcessing(false);
        return;
      }

      const methodPayload = {
        type: paymentMethod === "CreditCard" ? "CARD" : paymentMethod === "afterpay" ? "afterpay_clearpay" : paymentMethod === "zip" ? "zip" : "PAYPAL",
        provider: paymentMethod === "paypal" ? "paypal" : "stripe",
      };

      const result = await retryPayment({
        order_id: orderId,
        payment_method: methodPayload,
      }).unwrap();

      if (paymentMethod === "paypal") {
        if (result.approval_url) {
          window.location.href = result.approval_url;
          return;
        }
        toast.error("PayPal initiation failed");
        setIsProcessing(false);
        return;
      }

      if (paymentMethod === "afterpay" || paymentMethod === "zip") {
        const paymentOptions = {
          clientSecret: result.client_secret,
          confirmParams: {
            return_url: window.location.origin + "/order-status?status=success",
            payment_method_data: {
              type: paymentMethod === "afterpay" ? "afterpay_clearpay" : "zip",
            },
          },
          redirect: "if_required",
        } as never as Parameters<NonNullable<typeof stripe>["confirmPayment"]>[0];

        const confirmResult = await stripe?.confirmPayment(paymentOptions);

        if (confirmResult?.error) {
          toast.error(confirmResult.error.message || "Payment failed");
        }
        setIsProcessing(false);
        return;
      }

      // Credit Card
      const cardElement = elements?.getElement(CardElement);
      if (!cardElement) {
        toast.error("Card details not found");
        setIsProcessing(false);
        return;
      }

      const stripeResult = await stripe?.confirmCardPayment(result.client_secret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (stripeResult?.error) {
        toast.error(stripeResult.error.message || "Payment failed");
      } else if (stripeResult?.paymentIntent?.status === "succeeded") {
        toast.success("Payment successful!");
        onClose();
        // Since we are on the order page, a window reload or refetch might be triggered by parent.
        window.location.reload(); 
      }
    } catch (err) {
      console.error("Retry payment failed", err);
      toast.error("Failed to retry payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="popupModal" className="ordermodal retrypopup">
      <div className="modal-content" style={{padding: "30px" }}>
        <button className="close" onClick={onClose} aria-label="Close modal" style={{ float: "right", fontSize: "28px", background: "none", border: "none", cursor: "pointer" }}>
          ×
        </button>
        <h3 className="align-center  pt-0">Retry Payment</h3>
        <p className="align-center mb-20 text-gray-600">Select a payment method to complete your order.</p>

        <form onSubmit={handleSubmit} className="checkout-form mt-30">
          <div className="payment-details">
            <div className="payment-card mb-20" style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px" }}>
              <label className="flex gap-2 cursor-pointer font-bold">
                <input
                  type="radio"
                  name="retryPaymentMethod"
                  value="CreditCard"
                  checked={paymentMethod === "CreditCard"}
                  onChange={() => setPaymentMethod("CreditCard")}
                />
                Credit Card
              </label>
              <div className="payment-logos dflex">
                <div className="payment-img"><img src="/images/visa.svg" alt="Visa" /></div>
                <div className="payment-img"><img src="/images/payment.svg" alt="Mastercard" /></div>
                <div className="payment-img"><img src="/images/american.svg" alt="Amex" /></div>
              </div>
              
              {paymentMethod === "CreditCard" && (
                <div>
                  <div className="stripe-card-element bg-white p-3 border rounded">
                    <CardElement options={{ hidePostalCode: true }} />
                  </div>
                </div>
              )}
            </div>

            <div className="payment-option mb-10" style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px" }}>
              <label className="flex justify-between items-center w-full cursor-pointer font-bold">
                <div className="flex gap-2">
                  <input
                    type="radio"
                    name="retryPaymentMethod"
                    value="paypal"
                    checked={paymentMethod === "paypal"}
                    onChange={() => setPaymentMethod("paypal")}
                  />
                  Paypal
                </div>
                <img src="/images/paypal.svg" alt="Paypal" />
              </label>
            </div>

            <div className="payment-option mb-10" style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px" }}>
              <label className="flex justify-between items-center w-full cursor-pointer font-bold">
                <div className="flex gap-2">
                  <input
                    type="radio"
                    name="retryPaymentMethod"
                    value="afterpay"
                    checked={paymentMethod === "afterpay"}
                    onChange={() => setPaymentMethod("afterpay")}
                  />
                  Afterpay
                </div>
                <img src="/images/afterpay.svg" alt="Afterpay" />
              </label>
            </div>

            <div className="payment-option mb-20" style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px" }}>
              <label className="flex justify-between items-center w-full cursor-pointer font-bold">
                <div className="flex gap-2">
                  <input
                    type="radio"
                    name="retryPaymentMethod"
                    value="zip"
                    checked={paymentMethod === "zip"}
                    onChange={() => setPaymentMethod("zip")}
                  />
                  Zippay
                </div>
                <img src="/images/zip.svg" alt="Zippay" />
              </label>
            </div>
          </div>

          <Button
            type="submit"
            className="btn btn-red btn-filled btn-sharp w-100 mt-20"
            isLoading={isProcessing}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Pay Now"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RetryPaymentForm;
