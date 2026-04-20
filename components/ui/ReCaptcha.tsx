

"use client";

import ReCAPTCHA from "react-google-recaptcha";
import { useRef, useState } from "react";

export default function ReCaptcha({
  onCaptchaChange,
}: {
  onCaptchaChange: (token: string | null) => void;
}) {
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleCaptchaChange = (token: string | null) => {
    onCaptchaChange(token);
  };

  return (
    <ReCAPTCHA
      ref={recaptchaRef}
      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
      onChange={handleCaptchaChange}
    />
  );
}
