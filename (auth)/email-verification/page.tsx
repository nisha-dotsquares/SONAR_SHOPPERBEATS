"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useResendVerificationCodeMutation } from "@/lib/redux/apis/authApi";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/loaders/Loader";

function VerifyEmailInner() {
  const [resendVerificationCode, { isLoading: isResending }] = useResendVerificationCodeMutation();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [emailInput, setEmailInput] = useState(email);
  const [cooldown, setCooldown] = useState(0);

  const handleResendEmail = async () => {
    if (!emailInput.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown} seconds before resending`);
      return;
    }

    try {
      await resendVerificationCode({ email: emailInput }).unwrap();
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
      const error = err as { data?: { message?: string } };
      const errorMessage = error?.data?.message || "Failed to send verification email";
      toast.error(errorMessage);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-4 text-center max-w-md w-full rounded-xl shadow-md">
        {/* Illustration */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/auth/verifyemail.jpg"
            alt="Verify email"
            width={400}
            height={400}
            priority
          />
        </div>

        {/* Heading */}
        <h5 className=" mb-40">
          Verify your email
        </h5>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          We've sent a verification link to your email address.
          Please check your inbox and click the link to activate your account.
        </p>

        {/* Helper text */}
        <p className="text-sm text-gray-500 mb-4">
          Didn't receive the email? Enter your email below to resend.
        </p>

        {/* Email input */}
        <div className="form-item mb-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            disabled={isResending}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            className="btn btn-red btn-filled btn-sharp w-full"
            onClick={handleResendEmail}
            disabled={isResending || cooldown > 0}
            isLoading={isResending}
          >
            {cooldown > 0 
              ? `Resend in ${cooldown}s` 
              : isResending 
                ? "Sending..." 
                : "Resend verification email"
            }
          </Button>

          <Link
            href="/login"
            className="text-sm text-red-600 hover:underline mt-40"
          >
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function EmailVerificationPage() {
  return (
    <Suspense fallback={<><Loader/></>}>
      <VerifyEmailInner />
    </Suspense>
  );
}