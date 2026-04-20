import { Product, Variant } from "@/types/product";

export const getPriceDetails = (
  product: Product,
  variant?: Variant | null
) => {

  // Base price (if variant has price → override)
const price = Number.parseFloat(
  String(
    variant?.price ??
    product?.variant_price ??
    product?.price ??
    "0"
  )
);


  // RRP price from variant OR product (skip if null)
  const RRP = 
  variant?.rrp_price
    ? Number.parseFloat(String(variant.rrp_price))
    : product.rrp_price
    ? Number.parseFloat(String(product.rrp_price))
    : 0;

  // Discounted price ALWAYS comes from product
  const discounted = Number.parseFloat(String(product.discounted_price ?? 0));


  //  Determine final discounted price
  const effectiveDiscountPrice =
    discounted > 0
      ? discounted
      : RRP > 0 && RRP > price
      ? price
      : RRP > 0 ? RRP : price;


  const hasDiscount = RRP > 0 && effectiveDiscountPrice < RRP;

  //  Discount percentage
  const discountPercentage = hasDiscount && RRP > 0
    ? ((RRP - effectiveDiscountPrice) / RRP) * 100
    : 0;

  //  Save amount
  const saveAmount = hasDiscount && RRP > 0 ? RRP - effectiveDiscountPrice : 0;

  //  showWasPrice logic  
  const showWasPrice = hasDiscount;   // (show WAS only if price reduced)

  return {
    mainPrice: effectiveDiscountPrice,
    wasPrice: RRP,
    hasDiscount,
    showWasPrice,
    saveAmount,
    discountPercentage,
  };
};
