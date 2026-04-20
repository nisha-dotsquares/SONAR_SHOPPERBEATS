import { Product } from "./product";

export interface ImageUploadResponse {
  url?: string;
  image_url?: string;
  filename: string;
  size: number;
}

export interface ProductHighlightsResponse {
  products: {
    data: Product[];
  };
}
