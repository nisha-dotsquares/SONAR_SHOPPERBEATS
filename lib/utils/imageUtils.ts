import { Product, Variant } from "@/types/product";

export function getImageUrl(product: Product): string {
  const fallback = "/images/image-coming-soon.jpg";

  // CASE 1 → images is a single string
if (typeof product.images === "string" && product.images) {
  return product.images;
}

// CASE 1b → thumbnail is a string
if (typeof product.thumbnail === "string" && product.thumbnail) {
  return product.thumbnail;
}

  // CASE 2 → images is an array
  if (Array.isArray(product.images) && product.images.length > 0) {
    // Sort by image_order (ascending)
    const sortedImages = [...product.images]
      .filter(img => !!img.image_url)
      .sort((a, b) => (a.image_order ?? 9999) - (b.image_order ?? 9999));

    if (sortedImages.length > 0) {
      return sortedImages[0].image_url;
    }

    return fallback;
  }

  // CASE 3 → no images
  return fallback;
}



export function getVariantImage(variant: Variant): string {
  const fallback = "/images/image-coming-soon.jpg";

  if (!variant.images) return fallback;

  // CASE 1 → string
  if (typeof variant.images === "string" && variant.images) {
    return variant.images;
  }

  // CASE 2 → array
  if (Array.isArray(variant.images) && variant.images.length > 0) {
    const sortedImages = [...variant.images]
      .filter(img => !!img.image_url)
      .sort((a, b) => (a.image_order ?? 9999) - (b.image_order ?? 9999));

    if (sortedImages.length > 0) {
      return sortedImages[0].image_url;
    }

    return fallback;
  }

  return fallback;
}

