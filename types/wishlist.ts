import { Product, VariantAttribute } from "./product";

export interface WishlistItem extends Product {
  variant_id: string;
  variant_attributes?: VariantAttribute[];
  price?: string;
  created_at?: string;
  product_name:string;
  product_id:string;
  is_active: boolean;
  available_stock?: number;
}

export interface Wishlist {
  items: WishlistItem[];
  total_items: number;
}

export interface WishlistKey {
  product_id: string;
  variant_id: string | null;
}