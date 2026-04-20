
import { Cart, CartItem } from "@/types/cart";
import { Product } from "@/types/product";
import { cookies } from "next/headers";

export async function getCheckoutData(): Promise<{
  checkoutProducts: CartItem[];
  cartId: string | null;
  isBuyNow: boolean;
}> {
  const cartApiBaseUrl = process.env.NEXT_PUBLIC_API_URL_CART;

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const sessionCookie = allCookies.find(
    (c) => c.name === "sessionid" || c.name.includes("session") || c.name === "accessToken"
  );


  const headers = new Headers();
  if (sessionCookie) {
    headers.append("Cookie", `${sessionCookie.name}=${sessionCookie.value}`);
  }

  const options = { headers, cache: "no-store" as RequestCache };
  // Standard cart checkout flow

  try {
    const cartRes = await fetch(
      `${cartApiBaseUrl}/api/v1/cart/get-cart`,
      options
    );

    const rawCartResponse = await cartRes.text();


    if (!cartRes.ok) {
       return { checkoutProducts: [], cartId: null, isBuyNow: false };
    }
    
    const cart: Cart | null = JSON.parse(rawCartResponse);


    return {
      checkoutProducts: cart?.items || [],
      cartId: cart?.id || null,
      isBuyNow: false,
    };
  } catch (error) {
    console.error("[getCheckoutData] Error fetching cart:", error);
    return { checkoutProducts: [], cartId: null, isBuyNow: false };
  }
}
