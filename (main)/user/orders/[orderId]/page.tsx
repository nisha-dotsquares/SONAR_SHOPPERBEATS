"use client";

import React, { useState, use } from "react";
import {
  useGetOrderByIdQuery,
  useCancelOrderMutation,
  useCancelOrderItemMutation,
} from "@/lib/redux/apis/orderApi";
import { APIProduct, OrderReturn, OrderLineItem } from "@/types/order";
import CancelOrderPopup from "@/components/ui/CancelOrderPopup";
import ReturnOrderPopup from "@/components/ui/ReturnOrderPopup";
import ReplaceOrderPopup from "@/components/ui/ReplaceOrderPopup";
import RetryPaymentPopup from "@/components/ui/RetryPaymentPopup";
import { Elements } from "@stripe/react-stripe-js";
import stripePromise from "@/lib/stripe";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import Link from "next/link";
import Loader from "@/components/ui/loaders/Loader";
import { formatPrice } from "@/lib/utils/formatPrice";
import "../../../../../styles/Checkout.css";
import "../../../../../styles/Cart.css";
import "../../../../../styles/Product.css";
import { API_ENDPOINTS } from "@/lib/constants/api";

interface OrderDetailProps {
  params: Promise<{ orderId: string }>;
}

export default function OrderDetail({ params }: OrderDetailProps) {
  const { orderId } = use(params);
  const { data, isLoading, refetch } = useGetOrderByIdQuery(orderId);
  const [cancelOrder] = useCancelOrderMutation();
  const [cancelOrderItem] = useCancelOrderItemMutation();

  const [isCancelPopupOpen, setIsCancelPopupOpen] = useState(false);
  const [isReturnPopupOpen, setIsReturnPopupOpen] = useState(false);
  const [isReplacePopupOpen, setIsReplacePopupOpen] = useState(false);
  const [isCancelItemPopupOpen, setIsCancelItemPopupOpen] = useState(false);
  const [isReturnItemPopupOpen, setIsReturnItemPopupOpen] = useState(false);
  const [isRetryPopupOpen, setIsRetryPopupOpen] = useState(false);

  const [selectedItemForCancel, setSelectedItemForCancel] = useState<{ id: string, name: string } | null>(null);
  const [selectedItemForReturn, setSelectedItemForReturn] = useState<{ id: string, product: APIProduct } | null>(null);
  const [selectedItemForReplace, setSelectedItemForReplace] = useState<{ id: string, product: APIProduct } | null>(null);

  const handleCancelConfirm = async (
    id: string,
    cancelMessage: string,
    isItemLevel: boolean
  ) => {
    try {
      if (isItemLevel) {
        await cancelOrderItem({
          id: id,
          reason: cancelMessage,
        }).unwrap();
        toast.success("Item cancelled successfully!");
        setSelectedItemForCancel(null);
      } else {
        await cancelOrder({
          order_id: id,
          reason: cancelMessage,
        }).unwrap();
        toast.success("Order cancelled successfully!");
      }
      setIsCancelPopupOpen(false);
      refetch();
    } catch (error) {
      toast.error(`Failed to cancel ${isItemLevel ? 'item' : 'order'}.`);
      console.error(`Failed to cancel ${isItemLevel ? 'item' : 'order'}:`, error);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL_ORDER || "";
      const endpoint = API_ENDPOINTS.ORDER.GET_INVOICE(orderId);
      const url = `${baseUrl}${endpoint}`;

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch invoice");

      const html = await response.text();
      const blob = new Blob([html], { type: "text/html" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Invoice-${order?.order_number || orderId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  };

  if (isLoading) return <Loader />;
  if (!data) return <p>Order not found</p>;

  const order = data;
  const snapshot = order.order_details?.customer_snapshot || {};
  const products = snapshot.products || [];
  const orderItems = order.items || [];

  const isCancelled =
    order.shipstation_order_status?.toLowerCase() === "cancelled";
  return (
    <div>
      {/* Header */}
      <div className="dflex order-action justify-between">
        <h4>Order Detail</h4>
        <div className="btn-action btn-track">
          {(order.available_actions?.includes("retry") || order.available_actions?.includes("retry_payment")) && (
            <Button
              className="btn btn-red btn-filled btn-sharp"
              onClick={() => setIsRetryPopupOpen(true)}
            >
              Retry Payment
            </Button>
          )}
          {order.tracking_link && (
            <Link
              href={order.tracking_link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-red btn-filled btn-sharp"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Track Order
            </Link>
          )}
          {order.available_actions?.includes("cancel") && (
            <Button
              className="btn btn-link"
              onClick={() => {
                setSelectedItemForCancel(null);
                setIsCancelPopupOpen(true);
              }}
            >
              Cancel Order
            </Button>
          )}
          {order.available_actions?.includes("return") && (
            <Button
              className="btn btn-link"
              onClick={() => {
                setSelectedItemForReturn(null);
                setIsReturnPopupOpen(true);
              }}
            >
              Return Order
            </Button>
          )}
          {order.available_actions?.includes("replace") && (
            <Button
              className="btn btn-link"
              onClick={() => {
                setSelectedItemForReplace(null);
                setIsReplacePopupOpen(true);
              }}
            >
              Replace Order
            </Button>
          )}
          {order.status?.toLowerCase() === "delivered" && (
            <Button
              className="btn btn-red btn-outline btn-sharp"
              onClick={handleDownloadInvoice}
            >
              Download Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Order Info */}
      <div className="dflex order-detail mt-30">
        <div className="order-item">
          <h5>Order Number</h5>
          <p>{order.order_number || order.id}</p>
        </div>

        <div className="order-item">
          <h5>Total Payment</h5>
          <p>
            {order.currency} {formatPrice(order.total_amount)}
          </p>
        </div>

        <div className="order-item">
          <h5>Payment Method</h5>
          <p>{snapshot.payment_method?.type || "N/A"}</p>
        </div>

<div className="order-item">
  <h5>Order Status</h5>

  <div style={{ textTransform: "capitalize" }}>
    {order.returns?.some((r: OrderReturn) => r?.status?.toLowerCase() === "requested") ? (
      "Return Requested"
    ) : (
      order.status || "N/A"
    )}
  </div>
</div>

        <div className="order-item">
          <h5>
            {order.status === "delivered"
              ? "Delivered on"
              : "Estimated Delivery"}
          </h5>
          <p>{order.estimated_delivery_range || "Not Available"}</p>
        </div>
      </div>

      {/* Products Table */}
      <table className="cart-table order-table">
        <thead className="visually-hidden">
          <tr>
            <th scope="col">Product Information</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product: APIProduct, idx: number) => {
            const matchingItem = orderItems.find((item: OrderLineItem) => item.product_id === product.product_id);
            const trueItemId = matchingItem?.id || product.id || product.item_id || product.product_id;

            return (
              <tr key={idx}>
                <td className="item-info">
                  <Link href={`/product/${product.unique_code || product.product_id}`}>
                    <img src={product.image} alt={product.name} className="cursor-pointer" />
                  </Link>
                  <div>
                    <Link href={`/product/${product.unique_code || product.product_id}`}>
                      <h3 className="cursor-pointer hover:text-red-600 transition-colors">{product.name}</h3>
                    </Link>

                    {product?.variant_attributes?.length > 0 ? (
                      product?.variant_attributes?.map((attr, i) => (
                        <p key={i}>
                          <strong>{attr.name}:</strong> {attr.value}
                        </p>
                      ))
                    ) : (
                      <>
                        {product.size && (
                          <p>
                            <strong>Size:</strong> {product.size}
                          </p>
                        )}
                        {product.color && (
                          <p>
                            <strong>Colour:</strong> {product.color}
                          </p>
                        )}
                      </>
                    )}

                    <p>
                      <strong>Quantity:</strong> {product.quantity}
                    </p>

                    {/* Cancel & Return Item Buttons */}
                    {(matchingItem?.available_actions?.includes("cancel") || matchingItem?.available_options?.includes("cancel")) && (
                      <div className="mt-2 w-full">
                        <Button
                          className="text-red-600 hover:text-red-800 text-sm font-medium border border-red-200 px-3 py-1 rounded cursor-pointer"
                          onClick={() => {
                            setSelectedItemForCancel({ id: String(trueItemId), name: product.name });
                            setIsCancelItemPopupOpen(true);
                          }}
                        >
                          Cancel Item
                        </Button>
                      </div>
                    )}

                    {(matchingItem?.available_actions?.includes("return") || matchingItem?.available_options?.includes("return")) && (
                      <div className="mt-2 w-full">
                        <Button
                          className="text-red-600 hover:text-red-800 text-sm font-medium border border-red-200 px-3 py-1 rounded cursor-pointer"
                          onClick={() => {
                            setSelectedItemForReturn({ id: String(trueItemId), product });
                            setIsReturnPopupOpen(true);
                          }}
                        >
                          Return Item
                        </Button>
                      </div>
                    )}

                    {(matchingItem?.available_actions?.includes("replace") || matchingItem?.available_options?.includes("replace")) && (
                      <div className="mt-2 w-full">
                        <Button
                          className="text-red-600 hover:text-red-800 text-sm font-medium border border-red-200 px-3 py-1 rounded cursor-pointer"
                          onClick={() => {
                            setSelectedItemForReplace({ id: String(trueItemId), product });
                            setIsReplacePopupOpen(true);
                          }}
                        >
                          Replace Item
                        </Button>
                      </div>
                    )}

                    {(matchingItem?.available_actions?.includes("review") || matchingItem?.available_actions?.includes("add_review") || matchingItem?.available_options?.includes("review") || matchingItem?.available_options?.includes("add_review")) && (
                      <div className="mt-2 w-full">
                        <Link href={`/user/orders/${order.id}/review?product_id=${product.product_id}`}>
                          <Button
                            className="text-red-600 hover:text-red-800 text-sm font-medium border border-red-200 px-3 py-1 rounded cursor-pointer"
                          >
                            Add Review
                          </Button>
                        </Link>
                      </div>
                    )}

                    {product.status === "cancelled" && (
                      <p className="mt-2 text-red-600 text-sm font-medium">Cancelled</p>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Order Summary */}
      <div className="order-summery mt-30">
        <div className="summary-row">
          <p>Subtotal ({products.length} Items)</p>
          <p className="price">
            {order.currency} {formatPrice(order.subtotal)}
          </p>
        </div>

        <div className="summary-row">
          <p>Total Savings</p>
          <p className="savings">
            -{order.currency}{" "}
            {formatPrice(
              (Number(order.total_saving) || 0) +
              (Number(order.discount_amount) || 0)
            )}
          </p>
        </div>

        <div className="summary-row">
          <p>
            Delivery Details
            <span>
              Address: {snapshot.shipping_address.address},{" "}
              {snapshot.shipping_address.city}
            </span>
          </p>
          <p className="price">
            {order.currency} {formatPrice(order.shipping_cost)}
          </p>
        </div>

        <div className="total-row">
          <strong>Total (Incl. GST)</strong>
          <p className="price">
            {order.currency} {formatPrice(order.total_amount)}
          </p>
        </div>
      </div>

      <CancelOrderPopup
        isOpen={isCancelPopupOpen || isCancelItemPopupOpen} // handle legacy state if needed, but we unified above 
        onClose={() => {
          setIsCancelPopupOpen(false);
          setIsCancelItemPopupOpen(false);
          setSelectedItemForCancel(null);
        }}
        orderId={order.id}
        itemId={selectedItemForCancel?.id}
        itemName={selectedItemForCancel?.name}
        onCancelConfirm={handleCancelConfirm}
      />

      <ReturnOrderPopup
        isOpen={isReturnPopupOpen || isReturnItemPopupOpen}
        onClose={() => {
          setIsReturnPopupOpen(false);
          setIsReturnItemPopupOpen(false);
          setSelectedItemForReturn(null);
          refetch();
        }}
        orderId={order.id}
        itemId={selectedItemForReturn?.id}
        product={selectedItemForReturn?.product}
      />

      <ReplaceOrderPopup
        isOpen={isReplacePopupOpen}
        onClose={() => {
          setIsReplacePopupOpen(false);
          setSelectedItemForReplace(null);
          refetch();
        }}
        orderId={order.id}
        itemId={selectedItemForReplace?.id}
        product={selectedItemForReplace?.product}
      />

      <Elements stripe={stripePromise}>
        <RetryPaymentPopup
          isOpen={isRetryPopupOpen}
          onClose={() => setIsRetryPopupOpen(false)}
          orderId={order.id}
        />
      </Elements>
    </div>
  );
}
