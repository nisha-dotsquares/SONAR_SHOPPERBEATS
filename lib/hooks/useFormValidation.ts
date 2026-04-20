

import { useState, useCallback, useEffect } from "react";
import * as yup from "yup";

import { FormValidationResult } from "@/types/form";

export function useFormValidation<T extends object>(
  schema: yup.AnyObjectSchema,

  initialValues: T
): FormValidationResult<T> {
  const [formData, setFormData] = useState<T>(initialValues);
  const [formErrors, setFormErrors] = useState<{
    [key: string]: string | null;
  }>({}); // Re-run when initialValues reference changes

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement |HTMLSelectElement>) => {
      const checked =
        e.target instanceof HTMLInputElement && e.target.type === "checkbox"
          ? e.target.checked
          : undefined;
      const { name, value, type } = e.target; // Destructure type and checked
      setFormData((prevData) => ({
        ...prevData,
        [name]: type === "checkbox" ? checked : value, // Use checked for checkboxes
      }));
      // Clear error for the field as user types
      if (formErrors[name]) {
        setFormErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
      }
    },
    [formErrors]
  );

  const validateField = useCallback(
    async (fieldName: keyof T) => {
      try {
        await schema.validateAt(String(fieldName), formData);
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          [fieldName as string]: null,
        }));
      } catch (err) {
        if (err instanceof yup.ValidationError) {
          setFormErrors((prevErrors) => ({
            ...prevErrors,
            [fieldName as string]: err.message,
          }));
        }
      }
    },
    [schema, formData]
  );
  // Add useEffect to update formData when initialValues change
  useEffect(() => {
    setFormData(initialValues);
  }, []);
  const validateForm = useCallback(async () => {
    try {
      await schema.validate(formData, { abortEarly: false });
      setFormErrors({});
      return true;
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errors: { [key: string]: string | null } = {};
        err.inner.forEach((error) => {
          if (error.path) {
            errors[error.path] = error.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  }, [schema, formData]);

  const handleSubmit = useCallback(
    (
        callback: (data: T) => void,
        onError?: (errors: { [key: string]: string | null }) => void
      ) =>
      async (e?: React.FormEvent) => { // Make event optional
        e?.preventDefault(); // Conditionally call preventDefault
        const isValid = await validateForm();
        if (isValid) {
          callback(formData);
        } else if (onError) {
          onError(formErrors);
        }
      },
    [formData, validateForm]
  );

  const resetForm = useCallback(() => {
    setFormData(initialValues);
    setFormErrors({});
  }, [initialValues]);

  return {
    formData,
    formErrors,
    handleChange,
    handleSubmit,
    validateField,
    resetForm,
    setFormData,
    validateForm,
    setFormErrors
  };
}
