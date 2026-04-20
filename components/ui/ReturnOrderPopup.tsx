"use client";

import React, { useEffect, useState } from "react";
import * as yup from "yup";
import { useFormValidation } from "@/lib/hooks/useFormValidation";
import Button from "@/components/ui/Button";
import { useGetOrderByIdQuery, useGetReturnOptionsQuery, useReturnOrderMutation, useReturnOrderItemMutation } from "@/lib/redux/apis/orderApi";
import { useCreateAddressMutation, useGetAddressesQuery } from "@/lib/redux/apis/addressApi";
import AddressForm from "@/components/ui/AddressForm";
import { Address, AddressFormValues } from "@/types/address";

import { OrderAPIResponse, APIProduct, ReturnOption } from "@/types/order";
import { toast } from "react-toastify";
import { formatPrice } from "@/lib/utils/formatPrice";

interface ReturnOrderPopupProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  itemId?: string;
  product?: APIProduct | null;
}

const returnMessageSchema = yup.object().shape({
  reason: yup.string().required("Return reason is required"),
  customer_comment: yup.string(),
});

const ReturnOrderPopup: React.FC<ReturnOrderPopupProps> = ({
  isOpen,
  onClose,
  orderId,
  itemId,
  product,
}) => {
  const { data: order, isLoading: isLoadingOrder } = useGetOrderByIdQuery(orderId || "", { skip: !orderId });
  const { data: returnOptions, isLoading: isLoadingOptions } = useGetReturnOptionsQuery();
  const [returnOrder, { isLoading: isReturningOrder }] = useReturnOrderMutation();
  const [returnOrderItem, { isLoading: isReturningItem }] = useReturnOrderItemMutation();
  const { data: addresses, isLoading: isLoadingAddresses, refetch: refetchAddresses } = useGetAddressesQuery();

  const isReturning = isReturningOrder || isReturningItem;

  const [showAddressFormModal, setShowAddressFormModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const { formData, formErrors, handleChange, handleSubmit, resetForm } =
    useFormValidation(returnMessageSchema, {
      reason: "",
      customer_comment: "",
    });

useEffect(() => {
  if (order?.order_details) {
    const addr = order.order_details;

    setSelectedAddress({
      title: "Pickup Address",
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


  const handleConfirm = handleSubmit(async () => {
    if (!selectedAddress) {
      toast.error("Please select a return address.");
      return;
    }
    try {
      if (itemId) {
        await returnOrderItem({
          item_id: itemId,
          reason: formData.reason,
          customer_comment: formData.customer_comment,
          status: "requested",
          return_type: "return",
          first_name: selectedAddress.first_name,
          last_name: selectedAddress.last_name,
          address: selectedAddress.address,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postal_code: selectedAddress.pincode,
          country: selectedAddress.country,
          phone: selectedAddress.phone_number,
        }).unwrap();
        toast.success("Item return requested successfully!");
      } else {
        await returnOrder({
          order_id: order?.id,
          reason: formData.reason,
          customer_comment: formData.customer_comment,
          status: "requested",
          return_type: "return",
          first_name: selectedAddress.first_name,
          last_name: selectedAddress.last_name,
          address: selectedAddress.address,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postal_code: selectedAddress.pincode,
          country: selectedAddress.country,
          phone: selectedAddress.phone_number,
        }).unwrap();
        toast.success("Order return requested successfully!");
      }
      resetForm();
      onClose();
    } catch (err) {
      const error = err as { data?: { detail?: string; message?: string; error?: string } };
      const errorMessage =
        error?.data?.detail ||
        error?.data?.message ||
        error?.data?.error ||
        "Failed to process return. Please try again.";
      toast.error(errorMessage);
    }

  });

  const handleAddressFormSubmit = (values: AddressFormValues) => {
    const newAddress: Address = {
      ...values,
      id: undefined, // This is a temporary address, not a saved one
    };
    setSelectedAddress(newAddress);
    setShowAddressFormModal(false);
  };

  const combinedAddresses: Address[] = React.useMemo(() => {
    const apiAddresses = addresses || [];

    // If selectedAddress is local (no id), add it at top
    if (selectedAddress && !selectedAddress.id) {
      return [selectedAddress, ...apiAddresses];
    }

    return apiAddresses;
  }, [addresses, selectedAddress]);





  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 top-20 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-3xl max-h-[70vh] rounded-2xl shadow-2xl flex flex-col">

        {/* Header */}
        <div className="px-8 py-5 flex justify-between items-center">
          <h6 className="text-2xl font-semibold text-gray-800">
            {isLoadingOrder ? "Loading..." : itemId && product ? `Return Item: ${product.name}` : `Return Order #${order?.order_number || order?.id}`}
          </h6>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

          <p className="text-sm text-gray-500">
            Please provide a reason for returning {itemId ? "this item" : "this order"}.
          </p>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for return
            </label>
            <select
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              disabled={isLoadingOptions}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            >
              <option value="">
                {isLoadingOptions ? "Loading..." : "Select a reason"}
              </option>
              {returnOptions
                ?.filter((option: ReturnOption) => option.is_active)
                .map((option: ReturnOption) => (
                  <option key={option.id} value={option.reason}>
                    {option.reason}
                  </option>
                ))}
            </select>

            {formErrors.reason && (
              <p className="text-red-500 text-xs mt-1">
                {formErrors.reason}
              </p>
            )}
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <h5 className="font-semibold text-gray-800 pb-20 " style={{ padding: "10px 0px" }}>
              Pickup Address
            </h5>

            {/* {isLoadingAddresses ? (
              <p>Loading addresses...</p>
            ) : addresses && addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map((address: Address) => (
                  <label
                    key={address.id}
                    style={{ display: 'flex', marginBottom: "10px" }}
                    className={`flex gap-4  items-cente p-4 border rounded-lg cursor-pointer transition ${selectedAddress?.id === address.id
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <input
                      type="radio"
                      name="shippingAddress"
                      checked={selectedAddress?.id === address.id}
                      onChange={() => setSelectedAddress(address)}
                      className="h-4 w-4 shrink-0 accent-red-600"
                    />

                    <div className="text-sm text-gray-700 leading-5">
                      <p className="font-medium">
                        {address.first_name} {address.last_name}
                      </p>
                      <p>
                        {address.address}, {address.city}, {address.state}{" "}
                        {address.pincode}
                      </p>
                      <p>{address.country}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Phone: {address.phone_number}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No saved addresses. Please add one.
              </p>
            )} */}


            {/* <Button
              type="button"
              className="text-red-600 hover:text-red-700 text-sm font-medium"
              onClick={() => setShowAddressFormModal(true)}
            >
              + Add New Address
            </Button> */}
            {selectedAddress && (
            <div className="selected-address-summary bg-gray-50 p-4 rounded-md">
              {/* <h6 className="font-semibold text-gray-700 mb-2">Selected Return Address</h6> */}
              <p className="text-sm text-gray-700">{selectedAddress.first_name} {selectedAddress.last_name}</p>
              <p className="text-sm text-gray-700">{selectedAddress.address}</p>
              <p className="text-sm text-gray-700">{selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}</p>
              <p className="text-sm text-gray-700">{selectedAddress.country}</p>
              <p className="text-sm text-gray-700">Phone: {selectedAddress.phone_number}</p>
            </div>
            )}
          </div>

          {/* {selectedAddress && (
            <div className="selected-address-summary bg-gray-50 p-4 rounded-md">
              <h6 className="font-semibold text-gray-700 mb-2">Selected Return Address</h6>
              <p className="text-sm text-gray-700">{selectedAddress.first_name} {selectedAddress.last_name}</p>
              <p className="text-sm text-gray-700">{selectedAddress.address}</p>
              <p className="text-sm text-gray-700">{selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}</p>
              <p className="text-sm text-gray-700">{selectedAddress.country}</p>
              <p className="text-sm text-gray-700">Phone: {selectedAddress.phone_number}</p>
            </div>
          )} */}

          {/* Comment */}
          <div>
            <label htmlFor="customer_comment" className="block text-sm font-medium text-gray-700 mb-2">
              Comment (optional)
            </label>
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

          {/* Refund Summary */}
          {order && (
            <div className="bg-gray-50 rounded-xl p-5 ">
              <h6 className="font-semibold text-gray-800 mb-4 text-lg" style={{ marginBottom: "10px" }}>
                {itemId ? "Item Refund Estimate" : "Refund Summary"}
              </h6>

              {itemId && product ? (
                <>
                  <div className="flex justify-between text-sm mb-2 text-gray-600">
                    <span>Item Price</span>
                    <span>{order.currency} {formatPrice(product.unit_price)} x {product.quantity}</span>
                  </div>
                  <div className="flex justify-between font-semibold  pt-3 mt-3 text-gray-800">
                    <span>Estimated Refund</span>
                    <span>
                      {order.currency}{" "}
                      {formatPrice((product.unit_price || 0) * (product.quantity || 1))}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm mb-2 text-gray-600">
                    <span>Order Subtotal</span>
                    <span>{order.currency} {order.subtotal}</span>
                  </div>

                  {/* <div className="flex justify-between text-sm mb-2 text-gray-600">
                    <span>Shipping Cost</span>
                    <span>{order.currency} {order.shipping_cost}</span>
                  </div> */}

                  <div className="flex justify-between font-semibold  pt-3 mt-3 text-gray-800">
                    <span>Estimated Refund</span>
                    <span>
                      {order.currency}{" "}
                      {formatPrice(order.subtotal - order.shipping_cost)}
                    </span>
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
            disabled={isReturning}
            style={{ padding: "12px 20px " }}
            className="px-6 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-60"
          >
            {isReturning ? "Submitting..." : "Submit Return"}
          </button>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressFormModal && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-[60] p-4"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              e.preventDefault();
              setShowAddressFormModal(false);
            }
          }}
          onClick={() => setShowAddressFormModal(false)} //  close on backdrop click
        >
          <div
            className="bg-white w-full max-w-xl rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto"
            role="presentation"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            <AddressForm
              from={"refund"}
              onSave={handleAddressFormSubmit}
              onCancel={() => setShowAddressFormModal(false)}
              isTemporaryInput={true}
            />
          </div>
        </div>
      )}

    </div>
  );


};

export default ReturnOrderPopup;
