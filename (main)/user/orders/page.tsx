"use client";

import React, { useEffect, useState } from "react";
import {
  useListOrdersQuery,
  useCancelOrderMutation,
} from "@/lib/redux/apis/orderApi";
import { useCapturePaymentMutation } from "@/lib/redux/apis/paymentApi";
import { useClearCartMutation, useGetCartQuery } from "@/lib/redux/apis/cartApi";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { APIProduct, OrderAPIResponse, OrderItem, Status, OrderReturn } from "@/types/order";
import CancelOrderPopup from "@/components/ui/CancelOrderPopup";
import ReturnOrderPopup from "@/components/ui/ReturnOrderPopup";
import RetryPaymentPopup from "@/components/ui/RetryPaymentPopup";
import { Elements } from "@stripe/react-stripe-js";
import stripePromise from "@/lib/stripe";
import { toast } from "react-toastify";
import { formatReadableDate } from "@/lib/utils/dateUtils";
import "../../../../styles/Checkout.css";
import "../../../../styles/Cart.css";
import "../../../../styles/Product.css";
import Loader from "@/components/ui/loaders/Loader";
import { API_ENDPOINTS } from "@/lib/constants/api";
import Pagination from "@/components/ui/Pagination";
import { useIntersectionObserver } from "@/lib/hooks/useIntersectionObserver";
import { formatPrice } from "@/lib/utils/formatPrice";

export default function MyOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cancelOrder] = useCancelOrderMutation();
  const [capturePayment] = useCapturePaymentMutation();
  const [clearCart] = useClearCartMutation();
  const { data: cart } = useGetCartQuery();

  const [isCancelPopupOpen, setIsCancelPopupOpen] = useState(false);
  const [isReturnPopupOpen, setIsReturnPopupOpen] = useState(false);
  const [isRetryPopupOpen, setIsRetryPopupOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const CHUNK_SIZE = 20;

  const [sortOrdersBy, setSortOrdersBy] = useState<"price" | "date">("date");

  const [currentPage, setCurrentPage] = useState(1);
  const [uiLimit, setUiLimit] = useState(10);

  const calculateStartFetchingPage = (uiPage: number, limit: number) => {
    const offset = (uiPage - 1) * limit;
    return Math.floor(offset / CHUNK_SIZE) + 1;
  };

  const [fetchingPage, setFetchingPage] = useState(
    calculateStartFetchingPage(1, 10)
  );

  const { data, isLoading, refetch, isFetching } = useListOrdersQuery({
    page: fetchingPage,
    per_page: CHUNK_SIZE,
    sort_by: sortOrdersBy === "date" ? "created_at" : "total_amount",
    sort_dir: "desc",
  }, {
    refetchOnMountOrArgChange: true,
  });

  const [allOrders, setAllOrders] = useState<OrderItem[]>([]);

  // Derived state for effective total (API provides total_items)
  const effectiveTotal = data?.total_items ?? 0;
  const totalPages = Math.ceil(effectiveTotal / uiLimit); // Based on UI limit

  useEffect(() => {
    if (!data?.data) return;

    const mapped: OrderItem[] = data.data.map((o: OrderAPIResponse) => {
      const products = o.order_details?.customer_snapshot?.products ?? [];
      const isCancelled = o.shipstation_order_status?.toLowerCase() === "cancelled";

      return {
        id: o.id,
        order_number: o.order_number,
        created_at: String(o.created_at),
        totalPayment: `${o.currency} ${formatPrice(o.total_amount)}`,
        paymentMethod: o.order_details?.customer_snapshot?.payment_method?.type ?? "N/A",
        status: o.status as Status,
        statusDate: o.estimated_delivery_date ?? "Not Available",
        estimated_delivery_range: o.estimated_delivery_range ?? "Not Available",
        isCancelled,
        available_actions: o.available_actions || [],
        tracking_link: o.tracking_link,
        returns: o.returns,
        hasRequestedReturn: o.returns?.some((r: OrderReturn) => r.status?.toLowerCase() === "requested"),
        products: products.map((p: APIProduct) => ({
          id: p.id,
          name: p.name,
          title: p.name,
          quantity: p.quantity,
          image: p.image,
          unit_price: p.unit_price,
          total_price: p.total_price,
          unique_code: p.unique_code,
          product_id: p.product_id,
          variant_attributes: p.variant_attributes || [],
          tags: p.tags || [],
        })),
      };
    });

    const startFetching = calculateStartFetchingPage(currentPage, uiLimit);

    if (fetchingPage === startFetching) {
      setAllOrders(mapped);
    } else if (fetchingPage > startFetching) {
      // Append logic
      setAllOrders(prev => {
        if (prev.length >= uiLimit) return prev;
        const newOrders = mapped.filter(o => !prev.some(existing => existing.id === o.id));
        return [...prev, ...newOrders].slice(0, uiLimit);
      });
    }
  }, [data, fetchingPage, currentPage, uiLimit]);

  // Reset pagination and clear orders when sort changes
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrdersBy(e.target.value as "price" | "date");
    setAllOrders([]);
    setCurrentPage(1);
    setFetchingPage(calculateStartFetchingPage(1, uiLimit));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsCancelPopupOpen(true);
  };

  const handleReturnClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsReturnPopupOpen(true);
  };

  const handleRetryPaymentClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsRetryPopupOpen(true);
  };


  const handleCancelConfirm = async (
    orderId: string,
    cancelMessage: string
  ) => {
    setIsCancelling(true);
    try {
      await cancelOrder({
        order_id: orderId,
        reason: cancelMessage,
      }).unwrap();
      toast.success("Order cancelled successfully!");
      setIsCancelPopupOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to cancel order.");
      console.error("Failed to cancel order:", error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadInvoice = async (orderId: string, orderNumber?: string) => {
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
      a.download = `Invoice-${orderNumber || orderId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFetchingPage(calculateStartFetchingPage(page, uiLimit));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (limit: number) => {
    setUiLimit(limit);
    setCurrentPage(1);
    setFetchingPage(calculateStartFetchingPage(1, limit));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  const handleLoadMore = () => {
    if (allOrders.length < uiLimit && allOrders.length < effectiveTotal && !isFetching) {
      setFetchingPage(prev => prev + 1);
    }
  };

  useIntersectionObserver({
    target: loadMoreRef as React.RefObject<Element>,
    onIntersect: () => {
      handleLoadMore();
    },
    enabled: allOrders.length < uiLimit && allOrders.length < effectiveTotal,
    rootMargin: "100px",
  });


  if (isLoading && allOrders.length === 0) return <div><Loader /></div>;

  return (
    <div>
      {allOrders.length > 0 ? (
        <div className="dflex justify-between">
          <h4>Orders ({effectiveTotal})</h4>

          <div className="product-sort">
            <span>Sort by:</span>
            <select
              value={sortOrdersBy}
              onChange={handleSortChange}
            >
              <option value="price">Price</option>
              <option value="date">Date</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="w-full flex justify-center py-20">
          <p>No orders yet</p>
        </div>
      )}


      {allOrders.map((order) => (
        <div key={order.id} className="order-block mt-30">
          <div className="dflex order-detail">
            <div className="order-item">
              <h5>Order Number</h5>
              <p>{order.order_number || order.id}</p>
            </div>
            <div className="order-item">
              <h5>Order Date</h5>
              <p>{formatReadableDate(order.created_at)}</p>
            </div>
            <div className="order-item">
              <h5>Total Payment</h5>
              <p>{order.totalPayment}</p>
            </div>

            <div className="order-item">
              <h5>Payment Method</h5>
              <p>{order.paymentMethod}</p>
            </div>

 <div className="order-item">
  <h5>Order Status</h5>

  <div style={{ textTransform: "capitalize" }}>
    {order?.returns?.some((r: OrderReturn) => r?.status?.toLowerCase() === "requested")
      ? "Return Requested"
      : (order?.status || "N/A")}
  </div>
</div>


            <div className="order-item">
              <h5>
                {order.status === Status.DELIVERED
                  ? "Delivered on"
                  : "Estimated Delivery Date"}
              </h5>
              <p>{order.estimated_delivery_range ||  "Not Available"}</p>
            </div>
          </div>

          <table className="cart-table order-table">
            <thead className="visually-hidden">
              <tr>
                <th scope="col">Product Information</th>
              </tr>
            </thead>
            <tbody>
              {order.products.map((product, idx) => (
                <tr key={idx}>
                  <td className="item-info">
                    <Link href={`/product/${product.unique_code || product.product_id || product.id}`}>
                      <img src={product.image} alt={product.title} className="cursor-pointer" />
                    </Link>
                    <div>
                      <Link href={`/product/${product.unique_code || product.product_id || product.id}`}>
                        <h3 className="cursor-pointer hover:text-red-600 transition-colors">{product.title}</h3>
                      </Link>
                      <div>
                        {product.variant_attributes?.map((attr, i) => (
                          <p key={i}>
                            <strong>{attr.name}:</strong> {attr.value}
                          </p>
                        ))}
                        <p>
                          <strong>Quantity:</strong> {product.quantity}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="dflex order-action justify-between">
            <div className="btn-action">
              {order.tracking_link && order.available_actions.includes("track") && (
                <Link
                  href={order.tracking_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-red btn-filled btn-sharp"
                >
                  Track Order
                </Link>
              )}
              {/* {order.available_actions.includes("review") && (
                <Link
                  href={`/user/orders/${order.id}/review?product_id=${order.product_id}`}
                  className="btn btn-red btn-filled btn-sharp"
                >
                  Add Review
                </Link>
              )} */}
              <button
                className="btn btn-red btn-outline btn-rounded cursor-pointer"
                onClick={() => router.push(`/user/orders/${order.id}`)}
              >
                View Order Details
              </button>
              {order.status?.toLowerCase() === "delivered" && (
                <button
                  className="btn btn-red btn-outline btn-rounded cursor-pointer"
                  onClick={() => handleDownloadInvoice(order.id, order.order_number)}
                >
                  Download Invoice
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              {(order.available_actions.includes("retry") || order.available_actions.includes("retry_payment")) && (
                <button
                  className="btn btn-red btn-filled btn-sharp"
                  onClick={() => handleRetryPaymentClick(order.id)}
                >
                  Retry Payment
                </button>
              )}
              {order.available_actions.includes("cancel") && (
                <button
                  className={`cursor-pointer ${isCancelling ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !isCancelling && handleCancelClick(order.id)}
                >
                  Cancel Order
                </button>
              )}
              {order.available_actions.includes("return") && (
                <button
                  className="cursor-pointer"
                  onClick={() => handleReturnClick(order.id)}
                >
                  Return
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Sentinel for Infinite Scroll */}
      {allOrders.length < uiLimit && allOrders.length < effectiveTotal && (
        <div ref={loadMoreRef} className="w-full flex justify-center py-4">
          {isFetching && (
            <div className="dflex align-center">
              <span className="loader-spinner" style={{ marginRight: "10px", border: "2px solid #f3f3f3", borderTop: "2px solid #333", borderRadius: "50%", width: "16px", height: "16px", animation: "spin 1s linear infinite" }}></span>
              Loading more orders...
            </div>
          )}
        </div>
      )}

      <CancelOrderPopup
        isOpen={isCancelPopupOpen}
        onClose={() => setIsCancelPopupOpen(false)}
        orderId={selectedOrderId ?? ""}
        onCancelConfirm={handleCancelConfirm}
      />
      <ReturnOrderPopup
        isOpen={isReturnPopupOpen}
        onClose={() => setIsReturnPopupOpen(false)}
        orderId={selectedOrderId}
      />
      {selectedOrderId && (
        <Elements stripe={stripePromise}>
          <RetryPaymentPopup
            isOpen={isRetryPopupOpen}
            onClose={() => setIsRetryPopupOpen(false)}
            orderId={selectedOrderId}
          />
        </Elements>
      )}
      <div className="product-search bg-white mt-40">

        {/* Shared Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={uiLimit}
          onItemsPerPageChange={handleItemsPerPageChange}
          totalItems={effectiveTotal}
          limitOptions={[10, 20, 50, 100]}
        />
      </div>
    </div>
  );
}
