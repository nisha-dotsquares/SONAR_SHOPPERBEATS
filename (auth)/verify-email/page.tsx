"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useVerifyEmailMutation } from "@/lib/redux/apis/authApi";
import { toast } from "react-toastify";
import Image from "next/image";

function VerifyEmailInner() {
  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("key");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      const handleVerification = async () => {
        try {
          await verifyEmail({ token }).unwrap();
          setSuccess("Email verified successfully!");
          toast.success("Email verified successfully!");
          router.push("/");
        } catch (err) {
          const errorMessage =
            (err as { data?: { message?: string } })?.data?.message ||
            "An unexpected error occurred.";
          setError(errorMessage);
          toast.error(errorMessage);
          console.error("Failed to verify email:", err);
        }
      };
      handleVerification();
    }
  }, [token, verifyEmail, router]);

  return (
    <main>
      <div className="verification">
        {/* <h1>Email Verification</h1> */}
        {isLoading && <p>Verifying your email...</p>}
        {error && (
          <Image
            src="/images/auth/verification_not_done.svg"
            alt="verification failed"
            width={800}
            height={800}
          />
        )}
        {success && (
          <Image
            src="/images/auth/verification_done.svg"
            alt="verification success"
            width={800}
            height={800}
          />
        )}
        {!token && (
          <Image
            src="/images/auth/verification_not_done.svg"
            alt="verification failed"
            width={800}
            height={800}
          />
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p>Loading verification page...</p>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
