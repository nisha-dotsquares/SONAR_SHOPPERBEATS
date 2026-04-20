export  
interface FormValidationResult<T> {
  formData: T;
  formErrors: { [key: string]: string | null };
  setFormErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string | null }>>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement |HTMLSelectElement>
  ) => void;
  handleSubmit: (
    callback: (data: T) => void,
    onError?: (errors: { [key: string]: string | null }) => void
  ) => (e?: React.FormEvent) => Promise<void>;
  validateField: (fieldName: keyof T) => Promise<void>;
  resetForm: () => void;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
   validateForm: () => Promise<boolean>;
}
