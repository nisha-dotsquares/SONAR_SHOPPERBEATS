"use client";

import { useState, useEffect } from "react";
import * as yup from "yup";
import { useFormValidation } from "@/lib/hooks/useFormValidation";
import { toast } from "react-toastify";
import {
  useGetPersonalDataQuery,
  useUpdatePersonalDataMutation,
} from "@/lib/redux/apis/authApi";
import Button from "@/components/ui/Button";
import { toYYYYMMDD } from "@/lib/utils/dateUtils";
import { PersonalInfoFormData } from "@/types/auth";
import { dateOfBirth, email, nameField, phoneNumber } from "@/lib/hooks/useYupValidation";
import { handleAustralianPhoneNumberChange } from "@/lib/utils/phoneValidation";

const personalInfoSchema = yup.object().shape({
  first_name:nameField("First Name"),
  last_name: nameField("Last Name"),
  email: email,
  phonenumber:phoneNumber,
  date_of_birth: dateOfBirth,
});

export default function PersonalInformationPage() {
  const { data: personalData, isLoading, isError } = useGetPersonalDataQuery();
  const [updatePersonalData, { isLoading: isUpdating }] =
    useUpdatePersonalDataMutation();

  const { formData, formErrors, handleChange, handleSubmit, setFormData } =
    useFormValidation(personalInfoSchema, {
      first_name: "",
      last_name: "",
      email: "",
      phonenumber: "",
      date_of_birth: "",
    });

  const [originalData, setOriginalData] = useState<PersonalInfoFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phonenumber: "",
    date_of_birth: "",
  });

  useEffect(() => {
    if (personalData && personalData.response) {
      setFormData({
        first_name: personalData.response.first_name || "",
        last_name: personalData.response.last_name || "",
        email: personalData.response.email || "",
        phonenumber: personalData.response.phonenumber || "",
        date_of_birth: personalData.response.date_of_birth || "", // Assuming date_of_birth is not part of the API response or needs separate handling
      });
      setOriginalData({
        first_name: personalData.response.first_name || "",
        last_name: personalData.response.last_name || "",
        email: personalData.response.email || "",
        phonenumber: personalData.response.phonenumber || "",
        date_of_birth: personalData.response.date_of_birth || "", // Assuming date_of_birth is not part of the API response or needs separate handling
      });
    }
  }, [personalData, setFormData]);

  const handleFormSubmit = async (data: PersonalInfoFormData) => {
    try {
      const payload = {
        ...data,
        date_of_birth: data.date_of_birth
          ? toYYYYMMDD(data.date_of_birth)
          : null, // convert Date → string
      };

      await updatePersonalData(payload).unwrap();
      setOriginalData(data);

      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile.");
    }
  };

  const handleFormError = () => {
    toast.error("Please fix the errors before submitting.");
  };
const handlePhoneChange = (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const { value, error } = handleAustralianPhoneNumberChange(
    e,
    formData.phonenumber
  );

  setFormData((prev) => ({
    ...prev,
    phonenumber: value,
  }));

  formErrors.phonenumber = error;
};

  return (
    <div>
      <div className="profile-page">
        {/* Content */}
        <div className="">
          {/* Profile Image */}
          {/* <div className="profile-img">
            <img src="/images/profile/profile.svg" alt="Profile" className="avatar" />
            <div className="edit-icon">
              <img src="/images/profile/edit.svg" />
            </div>
          </div> */}

          {/* FORM */}
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            {/* First + Last name in same row */}
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

            {/* Email */}
            <div className="form-item">
              <label htmlFor="email">Email*</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter Email"
                value={formData.email}
                disabled
              />
            </div>

            {/* Phone */}
            <div className="form-item">
              <label htmlFor="phonenumber">Phone Number*</label>
                <input
                  id="phonenumber"
                  type="tel"
                  name="phonenumber"
                  placeholder="e.g. 0412345678 or +61412345678"
                  value={formData.phonenumber}
                  onChange={handlePhoneChange}
                  inputMode="numeric"
                  pattern="[0-9+]*"
                />

              {formErrors.phonenumber && (
                <p className="error">{formErrors.phonenumber}</p>
              )}
            </div>

            {/* date_of_birth */}
            <div className="form-item">
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
            </div>

            {/* Buttons */}
            {/* {isEditing ? (
              <div className="dflex ">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-sharp w-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn btn-red btn-filled btn-sharp w-100"
                >
                  {isUpdating ? "Saving..." : "Update"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleEdit}
                className="btn btn-red btn-filled btn-sharp w-100 mt-20"
              >
                Edit
              </button>
            )} */}

            <Button
              type="submit"
              disabled={isUpdating}
              isLoading={isUpdating}
              className="btn btn-red btn-filled btn-sharp w-100 mt-20"
              debounceDelay={500}
            >
              {isUpdating ? "Saving..." : "Update"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
