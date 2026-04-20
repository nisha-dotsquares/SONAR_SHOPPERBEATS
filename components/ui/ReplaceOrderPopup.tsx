"use client";

import React, { useEffect, useRef, useState } from "react";
import * as yup from "yup";
import { useFormValidation } from "@/lib/hooks/useFormValidation";
import { useGetOrderByIdQuery, useGetReturnOptionsQuery, useReplaceOrderMutation, useReplaceOrderItemMutation } from "@/lib/redux/apis/orderApi";
import { useUploadAnyImageMutation } from "@/lib/redux/apis/productsApi";
import { Address } from "@/types/address";
import { APIProduct, ReturnOption } from "@/types/order";
import { toast } from "react-toastify";
import { formatPrice } from "@/lib/utils/formatPrice";

interface ReplaceOrderPopupProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  itemId?: string;
  product?: APIProduct | null;
}

const schema = yup.object().shape({
  reason: yup.string().required("Replacement reason is required"),
  customer_comment: yup.string(),
});

const ReplaceOrderPopup: React.FC<ReplaceOrderPopupProps> = ({ isOpen, onClose, orderId, itemId, product }) => {
  const { data: order, isLoading: isLoadingOrder } = useGetOrderByIdQuery(orderId || "", { skip: !orderId });
  const { data: returnOptions, isLoading: isLoadingOptions } = useGetReturnOptionsQuery();
  const [replaceOrder, { isLoading: isReplacingOrder }] = useReplaceOrderMutation();
  const [replaceOrderItem, { isLoading: isReplacingItem }] = useReplaceOrderItemMutation();
  const [uploadImage] = useUploadAnyImageMutation();

  const isReplacing = isReplacingOrder || isReplacingItem;

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { formData, formErrors, handleChange, handleSubmit, resetForm } = useFormValidation(schema, {
    reason: "",
    customer_comment: "",
  });

  useEffect(() => {
    if (order?.order_details) {
      const addr = order.order_details;
      setSelectedAddress({
        title: "Shipping Address",
        first_name: addr.shipping_first_name,
        last_name: addr.shipping_last_name,
        address: addr.shipping_address,
        city: addr.shipping_city,
        state: addr.shipping_state,
        pincode: addr.shipping_postal_code,
        country: addr.shipping_country,
        phone_number: addr.shipping_phone,
      });
    }
  }, [order]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...selectedFiles]);
      // Reset input value so the same file could be selected again if needed
      e.target.value = "";
    }
  };

  const removeImage = (indexToRemove: number) => {
    setAttachedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleConfirm = handleSubmit(async () => {
    if (!selectedAddress) {
      toast.error("No shipping address found.");
      return;
    }

    if (attachedFiles.length === 0) {
      setFileError("Please attach at least one image.");
      return;
    }
    setFileError("");

    try {
      const uploadedImageUrls: string[] = [];

      // Upload each image one by one as per customer review upload logic
      if (attachedFiles.length > 0) {
        for (const file of attachedFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_type", "product");
          formData.append("media_type", "image");
          const uploadRes = await uploadImage(formData).unwrap();
          if (uploadRes?.image_url || uploadRes?.url) {
            uploadedImageUrls.push(uploadRes.image_url || uploadRes.url || "");
          }
        }
      }

      const payload = {
        reason: formData.reason,
        customer_comment: formData.customer_comment || "",
        first_name: selectedAddress.first_name || "",
        last_name: selectedAddress.last_name || "",
        address: selectedAddress.address || "",
        city: selectedAddress.city || "",
        state: selectedAddress.state || "",
        postal_code: selectedAddress.pincode || "",
        country: selectedAddress.country || "",
        phone: selectedAddress.phone_number,
        status: "requested",
        return_type: "replacement",
        house_no: "",
        landmark: "",
        images: uploadedImageUrls,
      };

      if (itemId) {
        await replaceOrderItem({ ...payload, item_id: itemId }).unwrap();
        toast.success("Item replacement requested successfully!");
      } else {
        await replaceOrder({ ...payload, order_id: order?.id }).unwrap();
        toast.success("Order replacement requested successfully!");
      }
      resetForm();
      setAttachedFiles([]);
      onClose();
    } catch (err) {
      const error = err as { data?: { detail?: string; message?: string; error?: string } };
      const errorMessage =
        error?.data?.detail ||
        error?.data?.message ||
        error?.data?.error ||
        "Failed to process replacement. Please try again.";
      toast.error(errorMessage);
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 top-20 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-3xl max-h-[70vh] rounded-2xl shadow-2xl flex flex-col">

        {/* Header */}
        <div className="px-8 py-5 flex justify-between items-center">
          <h6 className="text-2xl font-semibold text-gray-800">
            {isLoadingOrder ? "Loading..." : itemId && product ? `Replace Item: ${product.name}` : `Replace Order #${order?.order_number || order?.id}`}
          </h6>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">Reason for replacement</label>
            <select
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              disabled={isLoadingOptions}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            >
              <option value="">{isLoadingOptions ? "Loading..." : "Select a reason"}</option>
              {returnOptions
                ?.filter((option: ReturnOption) => option.is_active)
                .map((option: ReturnOption) => (
                  <option key={option.id} value={option.reason}>{option.reason}</option>
                ))}
            </select>
            {formErrors.reason && <p className="error">{formErrors.reason}</p>}
          </div>
          {/* Attach Images */}
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">Attach Images <span className="text-red-500">*</span></label>
            <label htmlFor="file-upload" className="upload-box">
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <span className="plus">
                <img src="/images/profile/add.svg" alt="Add" />
              </span>
              <p>Add Images</p>
            </label>
            {fileError && <p className="error">{fileError}</p>}
            {attachedFiles.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginTop: "15px" }}>
                {attachedFiles.map((file, idx) => (
                  <div key={idx} style={{ position: "relative" }}>
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      style={{ width: "80px", height: "80px", objectFit: "contain", borderRadius: "8px", border: "1px solid #ddd" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      style={{ position: "absolute", top: "-8px", right: "-8px", background: "red", color: "white", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none", fontSize: "14px" }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* Comment */}
          <div>
            <label htmlFor="customer_comment" className="block text-sm font-medium text-gray-700 mb-2">Comment (optional)</label>
            <textarea
              id="customer_comment"
              name="customer_comment"
              rows={4}
              value={formData.customer_comment}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
              placeholder="Add additional details (if any)..."
            />
          </div>

        {/* Pickup Address */}
          <div className="space-y-4">
            <h5 className="font-semibold text-gray-800" style={{ padding: "10px 0px" }}>Pickup Address</h5>
            {selectedAddress && (
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-700">{selectedAddress.first_name} {selectedAddress.last_name}</p>
                <p className="text-sm text-gray-700">{selectedAddress.address}</p>
                <p className="text-sm text-gray-700">{selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}</p>
                <p className="text-sm text-gray-700">{selectedAddress.country}</p>
                <p className="text-sm text-gray-700">Phone: {selectedAddress.phone_number}</p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          {order && (
            <div className="bg-gray-50 rounded-xl p-5">
              <h6 className="font-semibold text-gray-800 mb-4 text-lg" style={{ marginBottom: "10px" }}>
                {itemId ? "Item Summary" : "Order Summary"}
              </h6>
              {itemId && product ? (
                <>
                  <div className="flex justify-between text-sm mb-2 text-gray-600">
                    <span>Item Price</span>
                    <span>{order.currency} {formatPrice(product.unit_price)} x {product.quantity}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-3 mt-3 text-gray-800">
                    <span>Item Total</span>
                    <span>{order.currency} {formatPrice((product.unit_price || 0) * (product.quantity || 1))}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm mb-2 text-gray-600">
                    <span>Order Subtotal</span>
                    <span>{order.currency} {order.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2 text-gray-600">
                    <span>Shipping Cost</span>
                    <span>{order.currency} {order.shipping_cost}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-3 mt-3 text-gray-800">
                    <span>Order Total</span>
                    <span>{order.currency} {formatPrice(order.total_amount)}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isReplacing}
            style={{ padding: "12px 20px" }}
            className="px-6 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-60"
          >
            {isReplacing ? "Submitting..." : "Submit Replacement"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplaceOrderPopup;
