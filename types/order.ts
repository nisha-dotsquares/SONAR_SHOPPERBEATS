import { VariantAttribute } from "./product";
 
 export interface OrderReturn {
   id: string;
   order_id: string;
   status: string;
 }

export interface APIProduct {

  name: string;
  title?: string;
  image: string;
  quantity: number;
  product_id: string;
  unit_price: number;
  total_price: number;
  discount_price?: number;
  unique_code?: string;
  id?: string;
  item_id?: string;
  status?: string;

  // optional: sometimes present
  size?: string;
  color?: string;

  // dynamic attributes
  variant_attributes: VariantAttribute[];
  tags?: string[];
  vendor_id?: string;
  available_actions?: string[];
  available_options?: string[];
}

export interface CustomerSnapshot { // Exported this
  products: APIProduct[];
  payment_method: {
    type: string;
  };
  shipping_address: {
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export interface ReturnOption {
  id: string;
  reason: string;
  is_active: boolean;
}

export interface OrderShippingDetails {
  shipping_first_name: string;
  shipping_last_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  shipping_phone: string;
  customer_snapshot: CustomerSnapshot;
}

export interface OrderLineItem {
  id: string;
  product_id: string;
  status: string;
  available_actions?: string[];
  available_options?: string[];
}

export interface OrderAPIResponse {
  id: string;
  order_number: string;
  status: string;
  shipstation_order_status: string;
  total_amount: number;
  currency: string;
  estimated_delivery_date: string | null;
  estimated_delivery_range?: string;
  subtotal: number;
  created_at: Date;
  shipping_cost: number;
  discount_amount: number;
  order_details: OrderShippingDetails;
  items: OrderLineItem[];
  total_saving?: number;
  available_actions: string[];
  tracking_link?: string;
  returns?: OrderReturn[];
}
export interface PaymentMethod {
  type: string;
  provider: string;
  transaction_id?: string;
  last4?: string;
}
export interface OrderItemPayload {
  product_id: string;
  variant_id?: string;
  quantity: number;
  vendor_id?: string;
  sku?: string | null;
  unique_code?: string | null;
  variant_attributes?: { name: string; value: string }[];
  name?: string;
  tags?: string[];
  unit_price?: number;
  total_price?: number;
  image?: string;
  ships_from_location?: string | null;
  ean_code?: string | null;
  handling_time_days?: number;
  supplier?: string | null;
  brand?: string | null;
}

export interface AddressPayload {
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface OrderPayload {
  items: OrderItemPayload[];
  shipping: AddressPayload;
  payment_method: PaymentMethod;
  promo_code?: string;
  total_amount: number;
  buyer_note?: string;
  warehouse_id?: string;
  supplier?: string | null;
  brand?: string | null;
}

export interface CreateOrderResponse {
  message: string;
  order_id: string;
  id: string;
  order_number?: string;
  approval_url?: string;
  client_secret:string;
  shipping_cost:number;
}

export interface CancelOrderResponse {
  message: string;
}

export interface OrderActionResponse {
  message: string;
  status?: string;
}

export interface ReturnOption {
  id: string;
  reason: string;
  is_active: boolean;
}

export interface AddReviewPayload {
  product_id: string;
  order_id: string;
  rating: number;
  comment: string;
  reviewer_name?: string;
  title?: string;
  images?: string[];
}

export interface AddReviewResponse {
  message: string;
  id?: string;
}

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  per_page?: number;
  status?: string;
  sort_by?: string;
  sort_dir?: string;
}
export enum Status {
  DELIVERED = "Delivered",
  IN_PROGRESS = "In Progress",
}

export interface OrderItem {
  id: string;
  order_number?: string;
  totalPayment: string;
  paymentMethod: string;
  created_at: string;
  status: Status;
  estimated_delivery_range: string;
  products: APIProduct[];
  isCancelled: boolean;
  available_actions: string[];
  tracking_link?: string;
  returns?: OrderReturn[];
  hasRequestedReturn?: boolean;
}

export interface CheckoutFormData {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  postcode: string;
  phone: string;
  cardNumber: string;
  expirationDate: string;
  securityCode: string;
  cardholderName: string;
  useShippingAddressAsBilling: boolean;
  billingFirstName: string;
  billingLastName: string;
  billingCompany: string;
  billingAddress: string;
  billingApartment: string;
  billingCity: string;
  billingState: string;
  billingPostcode: string;
  billingPhone: string;
  paymentMethod: string;
  country: string;
  billingCountry: string;
  buyNote: string;
}

export interface ReturnOrderPayload {
  order_id?: string;
  item_id?: string | number;
  reason: string;
  customer_comment?: string;
  status: string;
  return_type: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  house_no?: string;
  landmark?: string;
  images?: string[];
}