

import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import StoreProvider from "@/lib/redux/StoreProvider";
import { SEOProvider } from "@/contexts/SEOContext";
import DynamicHead from "@/components/ui/DynamicHead";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "../styles/globals.css";
import Script from "next/script";

import NextTopLoader from "nextjs-toploader";

export const metadata: Metadata = {
  title: "ShopperBeats",
  description: "Shop premium furniture, stylish home decor, and quality living essentials at ShopperBeats.",
};

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-figtree",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} antialiased`}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <StoreProvider>
            <SEOProvider>
              <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
              <NextTopLoader color="#FF0000" showSpinner={false} />
              <DynamicHead
                metadata={{
                  title: "ShopperBeats",
                  description:
                    "Shop premium furniture, stylish home decor, and quality living essentials at ShopperBeats.",
                  robots: "index, follow",
                }}
              />
              {children}
            </SEOProvider>
          </StoreProvider>
        </GoogleOAuthProvider>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&v=weekly&libraries=places&loading=async`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
