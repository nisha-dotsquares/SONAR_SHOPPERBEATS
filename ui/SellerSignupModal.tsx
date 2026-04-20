

"use client";
import { useState } from "react";
import * as yup from "yup";
import { useFormValidation } from "@/lib/hooks/useFormValidation";
import { useCreateVendorRequestMutation } from "@/lib/redux/apis/vendorApi";
import {toast} from "react-toastify";
import Button from "./Button";
import { handleAustralianPhoneNumberChange } from "@/lib/utils/phoneValidation";
import { email, nameField, strongPassword, confirmPassword, phoneNumber, requiredString, pincode, currency, creditLimit, website, message } from "@/lib/hooks/useYupValidation";
import AddressAutocomplete from "./AddressAutocomplete";

const step1Schema = yup.object().shape({
  name: nameField("Name"),
  email: email,
  password: strongPassword,
  confirmPassword: confirmPassword('password'),
});

const step2Schema = yup.object().shape({
  business_name: requiredString("Business name"),
  tax_id: requiredString("Tax ID"),
  taxIdLabel: requiredString("Tax ID label"),
  business_email: email,
  phone: phoneNumber,
  address_line1: requiredString("Address line 1"),
  address_line2: yup.string(),
  city: requiredString("City"),
  state_province: requiredString("State/Province"),
  postal_code: pincode,
  currency: currency,
  credit_limit: creditLimit,
  website: website,
  message: message,
});
interface SellerSignupModalProps {
  show: boolean;
  onClose: () => void; // a function that takes no arguments and returns nothing
}

export default function SellerSignupModal({ show, onClose }:SellerSignupModalProps) {
  const [step, setStep] = useState(1);
  const [createVendorRequest, { isLoading }] = useCreateVendorRequestMutation();
  const [autoAddress, setAutoAddress] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  
  const { formData, formErrors, handleChange, validateForm, resetForm } = useFormValidation(step1Schema, {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const {
  formData: formData2,
  formErrors: formErrors2,
  handleChange: handleChange2,
  handleSubmit: handleSubmit2,
  resetForm: resetForm2,
  setFormData: setFormData2,
  setFormErrors: setFormErrors2,
} = useFormValidation(step2Schema, {
  business_name: "",
  taxIdLabel: "",
  tax_id: "",
  business_email: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state_province: "",
  postal_code: "",
  currency: "",
  credit_limit: "",
  website: "",
  message: "",
});


const handlePhoneChange = (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const { value, error } = handleAustralianPhoneNumberChange(
    e,
    formData2.phone
  );

  setFormData2((prev) => ({
    ...prev,
    phone: value,
  }));

  if (error) {
    setFormErrors2((prev) => ({
      ...prev,
      phone: error,
    }));
  }
};


  if (!show) return null;

  const handleNext = async () => {
    const isValid = await validateForm();
    if (isValid) {
      setStep(2);
    }
  };

  const handleFinalSubmit = async () => {
    try {
      const combinedAddress = [manualAddress.trim(), autoAddress.trim()]
        .filter(Boolean)
        .join(", ");

      const vendorData = {
  name: formData.name,
  email: formData.email,
  password: formData.password,
  phone: formData2.phone,
  taxIdLabel: formData2.taxIdLabel,
  business_name: formData2.business_name,
  business_email: formData2.business_email,
  tax_id: formData2.tax_id,

  address_line1: combinedAddress || formData2.address_line1,
  address_line2: formData2.address_line2,
  city: formData2.city,
  state_province: formData2.state_province,
  postal_code: formData2.postal_code,

  currency: formData2.currency,
  credit_limit: formData2.credit_limit,
  website: formData2.website,

  message: formData2.message,
  country: 1,
};


      await createVendorRequest(vendorData).unwrap();
      toast.success("Vendor request submitted successfully!");
      
      // Reset both forms
      resetForm();
      resetForm2();
      setStep(1);
      setAutoAddress("");
      setManualAddress("");
      
      onClose();
    } catch (error) {
      toast.error("Failed to submit vendor request");
    }
  };

    return (

      <div id="popupModal" className="sellwmodal" style={{ display: "flex" }}>

        <div className="modal-content">

          <button className="close" onClick={onClose} aria-label="Close modal">
            ×
          </button>

  

          {step === 1 && (

            <>

              <h4 className="align-center">Sell with a new account</h4>

              <p className="align-center mb-24">Sign up to start selling.</p>

  

              <div className="form-item">

                <label htmlFor="name">Your name</label>

                <input type="text" id="name" name="name" placeholder="First and last name" value={formData.name} onChange={handleChange} />
                {formErrors.name && <p className="error">{formErrors.name}</p>}
              </div>

  

              <div className="form-item">

                <label htmlFor="email">Email</label>

                <input type="text" id="email" name="email" placeholder="Enter Email" value={formData.email} onChange={handleChange} />
                {formErrors.email && <p className="error">{formErrors.email}</p>}
              </div>

  

              <div className="form-item">

                <label htmlFor="password">Password</label>

                <input type="password" id="password" name="password" placeholder="Enter Password" value={formData.password} onChange={handleChange} />
                {formErrors.password && <p className="error">{formErrors.password}</p>}
                {/* <p>Passwords must be at least 6 characters.</p> */}

              </div>

  

              <div className="form-item">

                <label htmlFor="confirmPassword">Re-enter password</label>

                <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Re-enter password" value={formData.confirmPassword} onChange={handleChange} />
                {formErrors.confirmPassword && <p className="error">{formErrors.confirmPassword}</p>}
              </div>

  

              <Button
                              className="btn btn-red btn-filled btn-sharp w-100"
                              onClick={handleNext}>
                              Continue
                            </Button>
            </>
          )}
          {step === 2 && (
            <>
              <h4 className="align-center">Business Information</h4>
              <p className="align-center mb-24">
                Tell us about your business.
              </p>

              <form onSubmit={handleSubmit2(handleFinalSubmit)}>
                <div className="form-fields">
                  <div className="form-item">
                    <label htmlFor="business_name">Name</label>
                    <input id="business_name" placeholder="Name" type="text" value={formData2.business_name} name="business_name" onChange={handleChange2} />
                    {formErrors2.business_name && <p className="error">{formErrors2.business_name}</p>}
                  </div>
           
                  <div className="form-item">
                    <label htmlFor="business_email">Email</label>
                    <input id="business_email" placeholder="Email" type="text" value={formData2.business_email} name="business_email" onChange={handleChange2} />
                    {formErrors2.business_email && <p className="error">{formErrors2.business_email}</p>}
                  </div>
                  </div>
 <div className="form-fields">
                  <div className="form-item">
                    <label htmlFor="tax_id">Tax id</label>
                    <input id="tax_id" placeholder="Tax id" type="text" value={formData2.tax_id} name="tax_id" onChange={handleChange2} />
                    {formErrors2.tax_id && <p className="error">{formErrors2.tax_id}</p>}
                  </div>
              
                              <div className="form-item">
                    <label htmlFor="taxIdLabel">Tax id label</label>
                    <input id="taxIdLabel" placeholder="Tax id label" type="text" value={formData2.taxIdLabel} name="taxIdLabel" onChange={handleChange2} />
                    {formErrors2.taxIdLabel && <p className="error">{formErrors2.taxIdLabel}</p>}
</div>                  </div>
                <div className="form-fields">
                  <div className="form-item">
                    <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    placeholder="Enter Phone"
                    value={formData2.phone}
                    onChange={handlePhoneChange}
                    inputMode="numeric"
                    pattern="[0-9+]*"
                  />

                    {formErrors2.phone && <p className="error">{formErrors2.phone}</p>}
                  </div>
                                    <div className="form-item">
                    <label htmlFor="currency">Currency</label>
                    <input id="currency" placeholder="Currency" type="text" value={formData2.currency} name="currency" onChange={handleChange2} />
                  </div>
                </div>
                <div className="form-fields">
                  <div className="form-item">
                    <label htmlFor="address_line1">Address line1</label>
                    <AddressAutocomplete
                      id="address_line1"
                      placeholder="Address Line"
                      onPlaceSelect={(details) => {
                        setAutoAddress(details.address);
                        setFormData2((prev) => ({
                          ...prev,
                          address_line1: details.address, 
                          city: details.city,
                          state_province: details.state,
                          postal_code: details.pincode,
                        }));
                      }}
                    />
                    {formErrors2.address_line1 && <p className="error">{formErrors2.address_line1}</p>}
                  </div>
                  <div className="form-item">
                    <label htmlFor="address_line2">Address line2</label>
                    <input 
                      id="address_line2"
                      placeholder="Address line2" 
                      type="text" 
                      value={manualAddress} 
                      onChange={(e) => setManualAddress(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="form-fields">
                  <div className="form-item">
                    <label htmlFor="city">City</label>
                    <input id="city" placeholder="City" type="text" value={formData2.city} name="city" onChange={handleChange2} />
                    {formErrors2.city && <p className="error">{formErrors2.city}</p>}
                  </div>
                  <div className="form-item">
                    <label htmlFor="state_province">State province</label>
                    <input id="state_province" placeholder="State province" type="text" value={formData2.state_province} name="state_province" onChange={handleChange2} />
                    {formErrors2.state_province && <p className="error">{formErrors2.state_province}</p>}
                  </div>
                </div>
                <div className="form-fields">
                  <div className="form-item">
                    <label htmlFor="postal_code">Postal code</label>
                    <input id="postal_code" placeholder="Postal code" type="text" value={formData2.postal_code} name="postal_code" onChange={handleChange2} />
                    {formErrors2.postal_code && <p className="error">{formErrors2.postal_code}</p>}
                  </div>

                </div>

                <div className="form-fields">
                  <div className="form-item">
                    <label htmlFor="credit_limit">Credit limit</label>
                    <input id="credit_limit" placeholder="Credit limit" type="text" value={formData2.credit_limit} name="credit_limit" onChange={handleChange2} />
                  </div>
                  <div className="form-item">
                    <label htmlFor="website">Website</label>
                    <input id="website" placeholder="Website" type="text" value={formData2.website} name="website" onChange={handleChange2} />
                  </div>
                </div>
                <div className="form-item">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" value={formData2.message} onChange={handleChange2} placeholder="Additional message"></textarea>
                </div>
                <div className="dflex" style={{ gap: '10px' }}>
                  <Button
                    type="button"
                    className="btn btn-white btn-filled btn-sharp w-100"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="btn btn-red btn-filled btn-sharp w-100" disabled={isLoading}>
                    {isLoading ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </form>
            </>
          )}

        </div>

      </div>

    );
}
