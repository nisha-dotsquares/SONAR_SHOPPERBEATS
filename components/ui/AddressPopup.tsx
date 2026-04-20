"use client";

import { useGetAddressesQuery } from "@/lib/redux/apis/addressApi";
import { Address } from "@/types/address";
import AddressForm from "./AddressForm";
import { RootState } from "@/lib/redux/store";
import { useSelector } from "react-redux";

interface AddressPopupProps {
  show: boolean;
  onClose: () => void;
  editingAddress: Address | null;
}

export default function AddressPopup({
  show,
  onClose,
  editingAddress,
}: AddressPopupProps) {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { data: addresses } = useGetAddressesQuery(undefined, { skip: !isAuthenticated })

  if (!show) return null;

  const handleSave = () => {
    onClose();
  };

  return (
    <div id="popupModal" className="sellwmodal" style={{ display: "flex" }}>
      <div className="modal-content">
        <button className="close" onClick={onClose} aria-label="Close modal">
          ×
        </button>
        <h4>{editingAddress ? "Edit Address" : "Add Address"}</h4>
        <AddressForm
          editingAddress={editingAddress}
          addresses={addresses}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}