"use client"
import Link from 'next/link';
import React, { useState } from 'react';
import { useCancelOrderMutation } from "@/lib/redux/apis/orderApi";
import CancelOrderPopup from "@/components/ui/CancelOrderPopup";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import '../../styles/Checkout.css'


export interface PopupProduct {
  id: string;
  name: string;
  price: string;
  quantity: number;
  image?: string;
}

export interface OrderDetails {
  orderId?: string;
  orderNumber?: string;
  deliveryCost: string;
  totalAmount: string;
  products: PopupProduct[];
}

interface OrderSummaryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetails: OrderDetails;
  isAuthenticated:boolean;
  from?: string;
}

const OrderSummaryPopup: React.FC<OrderSummaryPopupProps> = ({ isOpen, onClose, orderDetails,isAuthenticated ,from}) => {
  const [isCancelPopupOpen, setIsCancelPopupOpen] = useState(false);
  const [cancelOrder] = useCancelOrderMutation();

  const handleCancelConfirm = async (orderId: string, reason: string) => {
    try {
      await cancelOrder({ order_id: orderId, reason: reason }).unwrap();
      toast.success("Order cancelled successfully!");
      setIsCancelPopupOpen(false);
      onClose(); // Close the OrderSummaryPopup after successful cancellation
      // Optionally, navigate to the order list page or refetch data on the parent page
    } catch {
      toast.error("Failed to cancel order.");
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div id={from ==="checkout"?"popupModal":"popupModall" }className="ordermodal">
      <div className="modal-content">
        <button className="close" onClick={onClose} aria-label="Close modal">
          &times;
        </button>
        <h3 className="align-center mb-24 pt-40">Your Order is Confirmed!</h3>
        <div className="order-summary order-wrapper">
          <h6 className="align-center">Order Number: #{orderDetails.orderNumber || orderDetails.orderId || 'N/A'}</h6>
          {orderDetails.products.map((item) => (
            <div key={item.id} className="summary-row">
              <div className="cart-img">
                {item.image && <img src={item.image} alt={item.name} />}
                <p>{item.name}</p>
              </div>
              <p>
                {item.quantity} &times; <span className="price">{item.price}</span>
              </p>
            </div>
          ))}
          <div className="summary-row delivery-cost">
            <div>
              <p>Delivery</p>
              {/* <span>Enter your address in the next step to confirm shipping cost</span> */}
            </div>
            <p className="price">{orderDetails.deliveryCost}</p>
          </div>
          {/* <div className="summary-row">
            <div>
              <span>
                1 Year Ovela Standard Care for Ovela Theodore Storage Bed Frame with Dr
              </span>
            </div>
            <p>FREE</p>
          </div> */}
          <div className="total-cart">
            <p>Total (incl. GST)</p>
            <p className="price">{orderDetails.totalAmount}</p>
          </div>
        </div>
        <Link href="/" className="btn btn-red btn-filled btn-sharp w-100 mt-30 mb-20">
          Continue Shopping
        </Link>
    { isAuthenticated &&   <Link href="/user/orders" className="btn btn-red btn-outline btn-rounded w-100">
          View Order
        </Link>}
        <p className="mt-30 align-center">
          Order placed by mistake?{" "}
          <Button
            className="btn-link"
            onClick={() => setIsCancelPopupOpen(true)}
          >
            Cancel Order
          </Button>
        </p>
      </div>
      <CancelOrderPopup
        isOpen={isCancelPopupOpen}
        onClose={() => setIsCancelPopupOpen(false)}
        orderId={orderDetails.orderId ?? ""}
        onCancelConfirm={handleCancelConfirm}
      />
    </div>
  );
};

export default OrderSummaryPopup;
