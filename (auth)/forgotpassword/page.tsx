"use client";

import { useForgotPasswordMutation } from "@/lib/redux/apis/authApi";
import { useFormValidation } from "@/lib/hooks/useFormValidation";
import * as yup from "yup";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import { email } from "@/lib/hooks/useYupValidation";


const forgotPasswordSchema = yup.object().shape({
  email_address:email
});

export default function ForgotPasswordPage() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();


  const { formData, formErrors, handleChange, handleSubmit } =
    useFormValidation(forgotPasswordSchema, { email_address: "" });

  const handleForgotPasswordSubmit = async () => {
    try {
      await forgotPassword(formData).unwrap();
      toast.success("Password reset link sent to your email.");
    } catch (err) {
      const errorMessage =
        (err as { data?: { message?: string } })?.data?.message ||
        "An unexpected error occurred.";
      toast.error(errorMessage);
      console.error("Failed to reset password:", err);
    }
  };

  return (
<main className="container">
  <div className="user-form-wrapper">
    <h3 className="align-center mb-24">Reset Password</h3>

    <form onSubmit={handleSubmit(handleForgotPasswordSubmit)} noValidate>
      <div className="form-item">
        <input
          type="email"
          id="email_address"
          name="email_address"
          placeholder="Enter Your Email"
          value={formData.email_address}
          onChange={handleChange}
          disabled={isLoading}
        />
        {formErrors.email_address && (
          <p className="error">{formErrors.email_address}</p>
        )}
      </div>

      <Button
        type="submit"
        className="btn btn-red btn-filled btn-sharp w-100"
        disabled={isLoading}
        isLoading={isLoading}
      >
        {isLoading ? "Sending..." : "Send Reset Link"}
      </Button>

      <div className="dflex link mt-30 justify-center">
        <p>
          New to ShopperBeats? <a href="/signup">Sign Up</a>
        </p>
      </div>
    </form>
  </div>
</main>

  );
}
