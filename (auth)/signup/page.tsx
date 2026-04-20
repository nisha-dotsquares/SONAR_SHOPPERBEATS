"use client";

import { useState, useEffect } from "react";
import { useResendVerificationCodeMutation, useSignupMutation } from "@/lib/redux/apis/authApi";
import { useFormValidation } from "@/lib/hooks/useFormValidation";
import * as yup from "yup";
import ReCaptcha from "@/components/ui/ReCaptcha";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import {
  confirmPassword,
  email,
  strongPassword,
} from "@/lib/hooks/useYupValidation";
import Link from "next/link";

const signupSchema = yup.object().shape({
  first_name: yup.string(),
  last_name: yup.string(),
  email: email,
  password: strongPassword,
  password2: confirmPassword("password"),
});

export default function SignupPage() {
  const [signup, { isLoading }] = useSignupMutation();
  const router = useRouter();
  const [recaptcha_token, setRecaptcha_token] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
  const [addToMailingList, setAddToMailingList] = useState(false);
  const [resendVerificationCode, { isLoading: isResending }] =
  useResendVerificationCodeMutation();

const [showResendEmail, setShowResendEmail] = useState(false);
const [cooldown, setCooldown] = useState(0);



const getInitialFormValues = () => ({
  email: "",
  password: "",
  password2: "",
  first_name: "",
  last_name: "",
});



const handleResendEmail = async () => {
  if (!formData.email.trim()) {
   toast.error("Please enter your email address", {
  toastId: "resend-email-error",
});

    return;
  }

 if (cooldown > 0) {
  toast.error(`Please wait ${cooldown} seconds before resending`, {
    toastId: "resend-cooldown",
  });
  return;
}


  try {
    await resendVerificationCode({ email: formData.email }).unwrap();
    toast.success("Verification email sent successfully!");

    setCooldown(60);
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  } catch (err) {
    setIsSubmitting(false);
  const errorMessage =
    (err as { data?: { detail?: string } })?.data?.detail ||
    "An unexpected error occurred.";

  if (errorMessage.trim() === "User Email Not Verified") {
    setShowResendEmail(true);
  }

  toast.error(errorMessage, {
    toastId: "signup-error",
  });
} finally {
  setIsSubmitting(false);
}

};

const { formData, formErrors, handleChange, handleSubmit, setFormData } =
  useFormValidation(signupSchema, getInitialFormValues());


  const handleSignupSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (!recaptcha_token) {
      toast.error("Please complete the reCAPTCHA.", {
        toastId: "captcha-error",
      });
       setIsSubmitting(false);
      return;
    }
    if (!termsAccepted) {
      toast.error("Please accept the Terms and Conditions.", {
        toastId: "terms-error",
      });
      setIsSubmitting(false);
      return;
    }
    try {
      // await signup({ ...formData, recaptcha_token }).unwrap();
      await signup({
        ...formData,
        recaptcha_token: "",
        addToMailingList,
      }).unwrap();

      toast.success("Signup successful! Please verify your email");
      router.push("/email-verification");
    } catch (err) {
      setIsSubmitting(false);
  const errorMessage =
    (err as { data?: { detail?: string } })?.data?.detail ||
    "An unexpected error occurred.";

  if (errorMessage.trim()=="User Email Not Verified") {
    setShowResendEmail(true);
  }

 toast.error(errorMessage, {
  toastId: "signup-error",
});

}

  };



useEffect(() => {
  setShowResendEmail(false);
  setCooldown(0);
}, [formData.email]);


  return (
    <div className="container">
      <div className="user-form-wrapper">
        <h3 className="align-center mb-24">Create an Account</h3>

        <form onSubmit={handleSubmit(handleSignupSubmit)} noValidate>
          {/* EMAIL */}
          <div className="form-item">
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter Your Email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
            {formErrors.email && <p className="error">{formErrors.email}</p>}
          </div>

          {/* PASSWORD */}
          <div className="form-item">
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter Your Password"
                value={formData.password}
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

            {formErrors.password && (
              <p className="error">{formErrors.password}</p>
            )}
          </div>

          {/* CONFIRM PASSWORD */}
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

        <div className="password-content">
          <p>Your password must have:</p>
          <ul>
            <li>Must be 8-24 characters long</li>
            <li>Must include uppercase and lowercase letters, numbers plus at least one special character</li>
          </ul>
        </div>


          {/* RECAPTCHA */}
          <div className="form-item">
            <ReCaptcha onCaptchaChange={setRecaptcha_token} />
          </div>

          {/* TERMS & CONDITIONS */}
          <div className="mt-18 mb-30 link">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              disabled={isLoading}
            />
            <span>
              I Agree to all the
              <Link href="/cms/terms-condition" target="_blank"> Terms & Conditions</Link>
            </span>
          </div>

          {/* MAILING LIST */}
          <div className="mt-18 mb-30 link">
            <input
              type="checkbox"
              id="mailingList"
              name="mailingList"
              checked={addToMailingList}
              onChange={(e) => setAddToMailingList(e.target.checked)}
              disabled={isLoading}
            />
            <span>Add me to the mailing list</span>
          </div>

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            className="btn btn-red btn-filled btn-sharp w-100"
            disabled={isLoading || isSubmitting}
            isLoading={isLoading || isSubmitting}
          >
            {isLoading ? "Signing up..." : "Sign Up"}
          </Button>
{showResendEmail && (
  <div className="resend-email-section mt-20 p-4 border border-gray-300 rounded-lg bg-gray-50">
    <p className="text-sm text-gray-600 mb-3">
      Your email is not verified. Click below to resend verification email.
    </p>

    <Button
      type="button"
      className="btn btn-outline btn-sharp w-100"
      onClick={handleResendEmail}
      disabled={isResending || cooldown > 0}
      isLoading={isResending}
    >
      {cooldown > 0
        ? `Resend in ${cooldown}s`
        : isResending
        ? "Sending..."
        : "Resend Verification Email"}
    </Button>
  </div>
)}

          {/* LOGIN LINK */}
          <div className="dflex link mt-30 justify-center">
            <p>
              Already have an account? <Link href="/login">Login</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
