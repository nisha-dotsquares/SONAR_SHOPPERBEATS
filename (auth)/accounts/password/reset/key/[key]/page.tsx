"use client";

import React, { useState } from "react";
import { useResetPasswordMutation } from "@/lib/redux/apis/authApi";
import { useFormValidation } from "@/lib/hooks/useFormValidation";
import * as yup from "yup";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import ReCaptcha from "@/components/ui/ReCaptcha";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { confirmPassword, strongPassword } from "@/lib/hooks/useYupValidation";

const resetPasswordSchema = yup.object().shape({
  password1: strongPassword,
  password2: confirmPassword("password1"),
});

interface PageProps {
  params: { key: string };
  searchParams: URLSearchParams;
}

export default function ResetPasswordPage({ params }: PageProps) {
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recaptcha_token, setRecaptcha_token] = useState<string | null>(null);
  const { key } = params;

  const router = useRouter();

  const { formData, formErrors, handleChange, handleSubmit } =
    useFormValidation(resetPasswordSchema, { password1: "", password2: "" });

  const handleResetPasswordSubmit = async () => {
    if (!key) {
      setError("Invalid or missing reset token.");
      toast.error("Invalid or missing reset token.");
      return;
    }
    if (!recaptcha_token) {
      toast.error("Please complete the reCAPTCHA.");
      return;
    }
    const [uid, ...tokenParts] = key.split("-");
    const token = tokenParts.join("-");

    try {
      await resetPassword({
        ...formData,
        uid,
        token,
        recaptcha_token: "",
      }).unwrap();
      setSuccess("Password has been reset successfully.");
      toast.success("Password has been reset successfully.");
      router.push("/login");
    } catch (err) {
      const errorMessage =
        (err as { data?: { message?: string } })?.data?.message ||
        "An unexpected error occurred.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Failed to reset password:", err);
    }
  };

  return (
<main className="container">
  <div className="user-form-wrapper">
    <h3 className="align-center mb-24">Reset Password</h3>

    <form onSubmit={handleSubmit(handleResetPasswordSubmit)} noValidate>
      
      {/* New Password */}
      <div className="form-item">
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            id="password1"
            name="password1"
            placeholder="Enter Your New Password"
            value={formData.password1}
            onChange={handleChange}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="eyeIcon"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {formErrors.password1 && (
          <p className="error">{formErrors.password1}</p>
        )}
      </div>
      {/* Confirm Password */}
      <div className="form-item">
        <div className="password-wrapper">
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="password2"
            name="password2"
            placeholder="Re-Enter Your New Password"
            value={formData.password2}
            onChange={handleChange}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="eyeIcon"
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {formErrors.password2 && (
          <p className="error">{formErrors.password2}</p>
        )}
      </div>

      {/* RECAPTCHA */}
      <div className="form-item">
        <ReCaptcha onCaptchaChange={setRecaptcha_token} />
      </div>

      {/* BUTTON */}
      <Button
        type="submit"
        className="btn btn-red btn-filled btn-sharp w-100"
        disabled={isLoading}
        isLoading={isLoading}
      >
        {isLoading ? "Resetting..." : "Submit"}
      </Button>

      {/* ERRORS / SUCCESS */}
      {error && <p className="error mt-10">{error}</p>}
      {success && <p className="success mt-10">{success}</p>}

      {/* SIGN UP LINK */}
      <div className="dflex link mt-30 justify-center">
        <p>New to ShopperBeats? <a href="/signup">Sign Up</a></p>
      </div>

    </form>
  </div>
</main>

  );
}
