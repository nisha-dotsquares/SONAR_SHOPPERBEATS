"use client";

import Button from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils/formatPrice";

interface DeliveryDetailsPopupProps {
  onClose: () => void;
  freeShipping: boolean;
  handlingTimeDays: number;
  fastDelivery: boolean;
  shippingCharge?: number;
}

export default function DeliveryDetailsPopup({
  onClose,
  freeShipping,
  handlingTimeDays,
  fastDelivery,
  shippingCharge
}: DeliveryDetailsPopupProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h5 className="align-center">Delivery Details</h5>
          <button onClick={onClose} className="close">×</button>
        </div>

        <table className="delivery-table">
          <tbody>
            <tr>
              <th>Fast Delivery</th>
              <td>{fastDelivery ? "Yes" : "No"}</td>
            </tr>
            <tr>
              <th>Shipping Time</th>
              <td>
                {handlingTimeDays === 1 ? (
                  "Same day dispatch"
                ) : (
                  `Leaves warehouse in 1 – ${handlingTimeDays} Business days`
                )}
              </td>
            </tr>
            <tr>
              <th>Free Shipping</th>
              <td>{freeShipping ? "Available" : "Not Applicable"}</td>
            </tr>
            {shippingCharge && <tr>
              <th>Shipping Charges</th>
              <td>$ {formatPrice(shippingCharge)}</td>
            </tr>}
          </tbody>
        </table>


      </div>
    </div>
  );
}
