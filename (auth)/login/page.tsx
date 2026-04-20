
"use client";
import { useGoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  useLoginMutation,
  useResendVerificationCodeMutation,
  useGoogleLoginMutation,
} from "@/lib/redux/apis/authApi";
import { useCreateWishlistMutation } from "@/lib/redux/apis/cartApi";
import { useFormValidation } from "@/lib/hooks/useFormValidation";
import *as yup from "yup";
import ReCaptcha from "@/components/ui/ReCaptcha";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Button from "@/components/ui/Button";
import { email, strongPassword } from "@/lib/hooks/useYupValidation";
import { LoginResponse } from "@/types/auth";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import Loader from "@/components/ui/loaders/Loader";

const loginSchema = yup.object().shape({
  email: email,
  password: strongPassword,
});

export default function LoginPage() {
  const [login, { isLoading }] = useLoginMutation();
  const [googleLogin, { isLoading: isGoogleLoading }] =
    useGoogleLoginMutation();
  const [resendVerificationCode, { isLoading: isResending }] =
    useResendVerificationCodeMutation();
  const [createWishlist] = useCreateWishlistMutation();
  const router = useRouter();
  const [recaptcha_token, setRecaptcha_token] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockUntil, setBlockUntil] = useState<Date | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    setRedirectUrl(redirect);
    // If already logged in, bounce away immediately
    if (isAuthenticated) {
      router.replace(redirect || "/");
    } else {
      setChecking(false);
    }
  }, [isAuthenticated]);

  const { formData, formErrors, handleChange, handleSubmit } = useFormValidation(
    loginSchema,
    { email: "", password: "" }
  );

  // Fire any wishlist intent saved before the user was redirected to login
  const flushPendingWishlist = async () => {
    const raw = sessionStorage.getItem('pendingWishlist');
    if (!raw) return;
    sessionStorage.removeItem('pendingWishlist'); // clear first to avoid retry loops
    try {
      const { product_id, variant_id } = JSON.parse(raw);
      await createWishlist({ product_id, variant_id }).unwrap();
      toast.success("Added to wishlist!");
    } catch {
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await googleLogin({
          access_token: tokenResponse.access_token,
        }).unwrap();
        toast.success("Login successful!");
        await flushPendingWishlist();
        router.push(redirectUrl || "/");
      } catch (err) {
        const error = err as { data?: { detail?: string; message?: string } };
        const errorMessage =
          error.data?.detail || error.data?.message || "An error occurred";
        toast.error(errorMessage);
      }
    },
    onError: () => {
      toast.error("Google login failed");
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleResendEmail = async () => {
    if (!formData.email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown} seconds before resending`);
      return;
    }

    try {
      await resendVerificationCode({ email: formData.email }).unwrap();
      toast.success("Verification email sent successfully!");

      // Start 60-second cooldown
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
      const errorMessage =
        (err as { data?: { message?: string } })?.data?.message || "Failed to send verification email";
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    if (isBlocked && blockUntil) {
      const interval = setInterval(() => {
        const now = new Date();
        const remaining = blockUntil.getTime() - now.getTime();
        if (remaining <= 0) {
          setIsBlocked(false);
          setBlockUntil(null);
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isBlocked, blockUntil]);

  const handleLoginSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!recaptcha_token) {
      toast.error("Please complete the reCAPTCHA.", {
        toastId: "captcha-error",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // await login({ ...formData, recaptcha_token }).unwrap();
      const response: LoginResponse = await login({
        ...formData,
        recaptcha_token: "",
        remember_me: rememberMe,
      }).unwrap();

      // Identify user in Zendesk AFTER successful login
      if (typeof window !== "undefined" && window.zE) {
        try {
          window.zE(
            "messenger",
            "loginUser",
            // @ts-ignore
            (callback: (userData: { email: string }) => void) => {
              callback({
                email: response.response.user.email || formData.email,
              });
            }
          );
        } catch {
          // Zendesk login failed silently
        }
      }




      toast.success("Login successful!");
      await flushPendingWishlist();
      router.push(redirectUrl || '/');
    } catch (err) {
      const error = err as { data?: { detail?: string; message?: string } };
      const errorMessage =
        error.data?.detail || error.data?.message || "An error occurred";

      if (errorMessage.includes("Account blocked")) {
        const timeMatch = errorMessage.match(/at\s+(.+)/);
        const blockUntilDate = timeMatch ? new Date(timeMatch[1]) : null;

        if (blockUntilDate && !Number.isNaN(blockUntilDate.getTime())) {
          const formattedTime = blockUntilDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          const msg = `Account blocked. Try again at ${formattedTime}`;
          setIsBlocked(true);
          setBlockUntil(blockUntilDate);
          toast.error(msg);
        } else {
          toast.error("Account temporarily blocked. Try again later.");
        }
      } else if (errorMessage === "User Email Not Verified") {
        setShowResendEmail(true);
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  useEffect(() => {
    setShowResendEmail(false);
    setCooldown(0);
  }, [formData.email]);


  if (checking) {
    return (
      <Loader />
    );
  }

  return (
    <div className="container">
      <div className="user-form-wrapper">
        <h3 className="align-center mb-24">Sign In</h3>

        <form onSubmit={handleSubmit(handleLoginSubmit)} noValidate>

          {/* EMAIL */}
          <div className="form-item">
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter Your Email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading || isBlocked}
            />
            {formErrors.email && (
              <p className="error">{formErrors.email}</p>
            )}
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
                disabled={isLoading || isBlocked}
              />

              <button type="button" onClick={togglePasswordVisibility} className="eyeIcon">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {formErrors.password && (
              <p className="error">{formErrors.password}</p>
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
          <div className="form-item ">
            <ReCaptcha onCaptchaChange={setRecaptcha_token} />
          </div>

          {/* REMEMBER ME */}
          <div className="mt-18 mb-30 flex items-center">
            <input
              type="checkbox"
              id="remember_me"
              name="remember_me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading || isBlocked}
              className="mr-2"
            />
            <label htmlFor="remember_me">Remember me</label>
          </div>

          {/* LOGIN BUTTON */}
          <Button
            type="submit"
            className="btn btn-red btn-filled btn-sharp w-100"
            disabled={isLoading || isBlocked || isSubmitting}
            isLoading={isLoading || isSubmitting}
          >
            {isLoading ? "Logging in..." : "Sign In"}
          </Button>

          {/* RESEND EMAIL VERIFICATION */}
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
                    : "Resend Verification Email"
                }
              </Button>
            </div>
          )}

          {/* FORGOT + SIGNUP LINKS */}
          <div className="dflex link mt-30 justify-between">
            <a href="/forgotpassword">Forgot Password</a>
            <p>
              New to ShopperBeats? <a href="/signup">Sign Up</a>
            </p>
          </div>

          {/* SOCIAL SIGNUP */}
          <div className="signup-account mt-30">
            <h6 className="align-center">or Sign In with</h6>

            <div className="btn-action justify-center">
              {/* <button className="cursor-pointer">
                <img src="/images/auth/facebook.svg" /> Sign In with Facebook
              </button> */}
              <Button
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={isGoogleLoading}
                className="social-btn cursor-pointer"
              >
                <img src="/images/auth/google.svg" alt="Google" />{" "}
                {isGoogleLoading ? "Signing in..." : "Sign In with Google"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
