import { Product, VariantAttribute } from "./product";

export interface CartItem extends Product {
  id: string; // override optional Product.id — cart items always have an id
  quantity: number;
  variant_id: string;
  variant_attributes: VariantAttribute[];
  unit_price: string;
  rrp_price_snapshot?: string;
  product_name: string;
  product_id: string;
  shipping_cost?: number;
  is_shippable?: boolean;
  is_active?: boolean;
  available_stock?: number;
  subtotal?: number;
  final_price?: number;
  original_price?: number;
  promotion_discount?: number;
  discount_per_unit?: number;
  discounted_unit_price?: number;
  applied_promotion_id?: string | null;
  applied_promotion_name?: string | null;
  cost_price_snapshot?: number;
  tags: string[];
  ships_from_location?: string;
  ean_code?: string | null;
  handling_time_days?: number;
  supplier?: string | null;
  brand?: string | null;
}

export interface CartState {
  items: CartItem[];
}

export interface Cart {
  items: CartItem[];
  total_price: number;
  subtotal: number;
  tax_total: number;
  items_total: number;
  items_discount: number;
  has_promotions: boolean;
  has_coupon: boolean;
  coupon_discount: number;
  coupon_usage_id: string | null;
  applied_coupon_code: string | null;
  shipping: number;
  shipping_cost: number;
  taxes: {
    name: string;
    rate: number;
    amount: string;
  }[];
  grand_total: number;
  id: string;
  applied_promo?: {
    code: string;
    discount_amount: number;
    discount_type: "percentage" | "fixed";
    discount_value: string;
  };
}

export interface PromoValidationResponse {
  is_valid: boolean;
  message: string;
  coupon_id: string | null;
  coupon_code: string | null;
  coupon_name: string | null;
  discount_type: "percentage" | "fixed" | null;
  discount_value: string | null;
  max_discount: string | null;
  reason: string | null;
}

export interface PromoData {
  new_total?: number;
  discount_amount?: number;
  code?: string;
  discount_type?: string;
  discount_value?: number;
}

export interface CapturePaymentResponse {
  status: string;
  order_id?: string;
  message?: string;
}

export interface VendorRequestPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  taxIdLabel?: string;
  business_name: string;
  business_email: string;
  tax_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  currency?: string;
  credit_limit?: string;
  website?: string;
  message?: string;
  country?: number;
}

export interface VendorRequestResponse {
  id: string;
  status: string;
  message?: string;
}
