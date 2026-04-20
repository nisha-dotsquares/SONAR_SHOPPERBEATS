"use client";

import { useState, useMemo, useEffect } from "react";
import * as yup from "yup";
import { useFormValidation } from "@/lib/hooks/useFormValidation";
import { toast } from "react-toastify";
import {
  useCreateAddressMutation,
  useUpdateAddressMutation,
} from "@/lib/redux/apis/addressApi";

import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import Button from "@/components/ui/Button";
import { toYYYYMMDD } from "@/lib/utils/dateUtils";
import { Address, AddressFormValues } from "@/types/address";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { handleAustralianPhoneNumberChange } from "@/lib/utils/phoneValidation";
import {
  dateOfBirth,
  nameField,
  phoneNumber,
  pincode,
  requiredString,
} from "@/lib/hooks/useYupValidation";

const addressSchema = yup.object().shape({
  title: yup.string().trim().required("Title is required"),
  customTitle: yup.string().when("title", (titleVal, schema) => {
    return titleVal[0] === "Others"
      ? schema.trim().required("Please enter a title")
      : schema.notRequired();
  }),
  first_name: nameField("First Name"),
  last_name: nameField("Last Name"),
  phone_number: phoneNumber,
  address: requiredString("Address"),
  city: requiredString("City"),
  state: requiredString("State"),
  pincode: pincode,
  country: requiredString("Country"),
  date_of_birth: dateOfBirth,
  is_default: yup.boolean(),
});

interface AddressFormProps {
  editingAddress?: Address | null;
  addresses?: Address[] | undefined;
  onSave: (data: AddressFormValues) => void; 
  onCancel?: () => void;
  isTemporaryInput?: boolean; 
  from?:string;
}

export default function AddressForm({ editingAddress, addresses, onSave, onCancel, isTemporaryInput ,from}: AddressFormProps) {
  const [createAddress, { isLoading: isCreating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();

  const [autoAddress, setAutoAddress] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [addressValid, setAddressValid] = useState(false);

  // Set manual address when editing


  const defaultInitialValues: AddressFormValues = useMemo(
    () => ({
      title: "Home",
      first_name: "",
      last_name: "",
      phone_number: "",
      customTitle: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      country: "",
      date_of_birth: null,
      is_default: false,
    }),
    []
  );

  const { formData, formErrors, handleChange, handleSubmit, setFormData, setFormErrors } =
    useFormValidation<AddressFormValues>(
      addressSchema,
      editingAddress || defaultInitialValues
    );
useEffect(() => {
  if (editingAddress) {
    setFormData({
      title: editingAddress.title || "Home",
      customTitle:
        editingAddress.title !== "Home" && editingAddress.title !== "Work"
          ? editingAddress.title
          : "",
      first_name: editingAddress.first_name || "",
      last_name: editingAddress.last_name || "",
      phone_number: editingAddress.phone_number || "",
      address: editingAddress.address || "",
      city: editingAddress.city || "",
      state: editingAddress.state || "",
      pincode: editingAddress.pincode || "",
      country: editingAddress.country || "",
      date_of_birth: editingAddress.date_of_birth || null,
      is_default: editingAddress.is_default || false,
    });

    setManualAddress(editingAddress.address || "");
    setAutoAddress("");
    setAddressValid(true); // existing saved address is already valid
  } else {
    setFormData(defaultInitialValues);
    setManualAddress("");
    setAutoAddress("");
    setAddressValid(false);
  }
}, [editingAddress, setFormData, defaultInitialValues]);
const handlePhoneChange = (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const { value, error } = handleAustralianPhoneNumberChange(
    e,
    formData.phone_number
  );

  setFormData((prev) => ({
    ...prev,
    phone_number: value,
  }));
  formErrors.phone_number = error;
 
};


  const handleSave = async (data: AddressFormValues) => {
    if (!manualAddress && !autoAddress) {
      toast.error("Address is required");
      return;
    }

    if (!addressValid) {
      toast.error("Please enter a valid address");
      return;
    }

    const combinedAddress = [manualAddress.trim(), autoAddress.trim()]
      .filter(Boolean)
      .join(", ");

    const finalData = { ...data };
    if (finalData.title === "Others") {
      finalData.title = finalData.customTitle || "";
    }

    // If in temporary input mode, don't make API calls, just pass data back
    if (isTemporaryInput) {
      onSave({ ...finalData, address: combinedAddress });
      return;
    }

    try {
      if (editingAddress) {
        if (!editingAddress.id) {
          toast.error("Invalid address ID");
          return;
        }

        const updatePayload: Address = {
          ...(finalData as Address), // Cast to Address for id
          id: editingAddress.id,
          address: combinedAddress,
        };

        await updateAddress({
          id: editingAddress.id, // URL param
          body: updatePayload, // BODY now also has id
        }).unwrap();

        toast.success("Address updated!");
      } else {
        const isFirstAddress = !addresses || addresses.length === 0;

        const createPayload: Address = {
          ...(finalData as Address), // Cast to Address for id
          address: combinedAddress,
          is_default: isFirstAddress ? true : finalData.is_default,
        };

        await createAddress(createPayload).unwrap();
        toast.success("Address added!");
      }

      onSave(finalData); 
      setManualAddress("");
      setAutoAddress("");
      setAddressValid(false);
      setFormData(defaultInitialValues);
      setResetKey(prev => prev + 1);
    } catch (error) {
      let message = "Failed to save address.";
      if (typeof error === "object" && error !== null && "data" in error) {
        const err = error as FetchBaseQueryError & {
          data?: { detail?: string };
        };
        message = err.data?.detail ?? message;
      }
      toast.error(message);
    }
  };

  return (
    <form className="mt-30" onSubmit={handleSubmit(handleSave)}>
      <div className="form-fields">
        <div className="form-item">
          <label htmlFor="first_name">First Name*</label>
          <input
            id="first_name"
            type="text"
            name="first_name"
            placeholder="First name"
            value={formData.first_name}
            onChange={handleChange}
          />
          {formErrors.first_name && (
            <p className="error">{formErrors.first_name}</p>
          )}
        </div>
        <div className="form-item">
          <label htmlFor="last_name">Last Name*</label>
          <input
            id="last_name"
            type="text"
            name="last_name"
            placeholder="Last name"
            value={formData.last_name}
            onChange={handleChange}
          />
          {formErrors.last_name && (
            <p className="error">{formErrors.last_name}</p>
          )}
        </div>
      </div>

      <div className="form-item">
        <label htmlFor="phone_number">Phone Number*</label>
        <input
          id="phone_number"
          type="tel"
          name="phone_number"
          placeholder="e.g. 0412345678 or +61412345678"
          value={formData.phone_number}
          onChange={handlePhoneChange}
          inputMode="numeric"
          pattern="[0-9+]*"
        />
        {formErrors.phone_number && (
          <p className="error">{formErrors.phone_number}</p>
        )}
      </div>

   {from!="refund" && <div className="form-item">
        <label htmlFor="date_of_birth">Date of Birth (Optional)</label>
        <input
          id="date_of_birth"
          type="date"
          name="date_of_birth"
          value={toYYYYMMDD(formData.date_of_birth)}
          onChange={handleChange}
          min="1900-01-01"
          max="2025-12-31"
        />
        {formErrors.date_of_birth && (
          <p className="error">{formErrors.date_of_birth}</p>
        )}
      </div> }   

      <div className="form-item">
        <label htmlFor="address-autocomplete">Address Line*</label>
        <AddressAutocomplete
          id="address-autocomplete"
          key={resetKey}
          placeholder="Address Line"
          onValidPlace={setAddressValid}
          onPlaceSelect={(details) => {
            setAutoAddress(details.address);
            setFormData((prev) => ({
              ...prev,
              address: details.address,
              city: details.city,
              state: details.state,
              pincode: details.pincode,
              country: details.country,
            }));
              setFormErrors((prev) => ({
              ...prev,
              pincode:"",
              address: "",
              city:"",
              state: "",
              country: "",
            }))
          }}
        />
      </div>
      <div className="form-item">
        <label htmlFor="manual_address">Address Line 1/ Street Address</label>
        <input
          id="manual_address"
          type="text"
          name="address"
          placeholder="Address Line 1/ Street Address"
          value={manualAddress}
          onChange={(e) => {
            const val = e.target.value;
            setManualAddress(val);
            setFormData((prev) => ({ ...prev, address: val }));
            if (val) {
              setFormErrors((prev) => ({ ...prev, address: "" }));
            } else {
              setAutoAddress("");
            }
          }}
        />
        {formErrors.address && <p className="error">{formErrors.address}</p>}
      </div>

      <div className="form-item">
        <label htmlFor="country">Country</label>
        <input
          id="country"
          type="text"
          name="country"
          placeholder="Country"
          value={formData.country}
          onChange={(e) => { handleChange(e); setAddressValid(false); }}
        />
        {formErrors.country && <p className="error">{formErrors.country}</p>}
      </div>
      <div className="form-fields">
        <div className="form-item">
          <label htmlFor="city">City</label>
          <input
            id="city"
            type="text"
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={(e) => { handleChange(e); setAddressValid(false); }}
          />
          {formErrors.city && <p className="error">{formErrors.city}</p>}
        </div>
        <div className="form-item">
          <label htmlFor="state">State</label>
          <input
            id="state"
            type="text"
            name="state"
            placeholder="State"
            value={formData.state}
            onChange={(e) => { handleChange(e); setAddressValid(false); }}
          />
          {formErrors.state && <p className="error">{formErrors.state}</p>}
        </div>
        <div className="form-item">
          <label htmlFor="pincode">Postcode</label>
          <input
            id="pincode"
            type="number"
            onWheel={(e) => e.currentTarget.blur()}
            name="pincode"
            placeholder="Postcode"
            value={formData.pincode}
            onChange={(e) => { handleChange(e); setAddressValid(false); }}
          />
          {formErrors.pincode && (
            <p className="error">{formErrors.pincode}</p>
          )}
        </div>
      </div>
      {formData.title === "Others" && (
        <div className="form-item">
          <label htmlFor="customTitle">Please Specify*</label>
          <input
            id="customTitle"
            name="customTitle"
            type="text"
            placeholder="Enter address type"
            value={formData.customTitle}
            onChange={handleChange}
          />
          {formErrors.customTitle && (
            <p className="error">{formErrors.customTitle}</p>
          )}
        </div>
      )}

      <div className="form-fields">
        <div className="form-item form-item-radio">
          <input
            type="radio"
            name="title"
            id="Home"
            value="Home"
            checked={formData.title === "Home"}
            onChange={handleChange}
          />
          <label htmlFor="Home">Home</label>
        </div>
        <div className="form-item form-item-radio">
          <input
            type="radio"
            name="title"
            id="Work"
            value="Work"
            checked={formData.title === "Work"}
            onChange={handleChange}
          />
          <label htmlFor="Work">Work</label>
        </div>
        <div className="form-item form-item-radio">
          <input
            type="radio"
            name="title"
            id="Others"
            value="Others"
            checked={formData.title === "Others"}
            onChange={(e) => {
              handleChange(e);
              setFormData((prev) => ({ ...prev, customTitle: "" }));
            }}
          />
          <label htmlFor="Others">Others</label>
        </div>

        <div className="form-item form-item-radio">
          <input
            id="is_default"
            type="checkbox"
            name="is_default"
            checked={formData.is_default}
            onChange={handleChange}
          />
          <label htmlFor="is_default">Set as Default Address</label>
        </div>
      </div>

      <Button
        className="btn btn-red btn-filled btn-sharp w-100 mt-20"
        type="submit"
        disabled={isTemporaryInput ? false : (isCreating || isUpdating)}
        isLoading={isTemporaryInput ? false : (isCreating || isUpdating)}
        debounceDelay={500}
      >
        {isCreating || isUpdating ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
