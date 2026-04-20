import { Product } from "@/types/product";
import { getPriceDetails } from "./getPriceDetails";
import { getImageUrl } from "./imageUtils";

export function transformProductData(products: Product[]) {
  return products.map((product) => {
    const priceInfo = getPriceDetails(product);

    return {
      ...product,
      unique_code: product.unique_code,
      mainPrice: priceInfo.mainPrice,
      wasPrice: priceInfo.wasPrice,
      showWasPrice: priceInfo.showWasPrice,
      discountPercentage: priceInfo.discountPercentage,
      saveAmount: priceInfo.saveAmount,
      image: getImageUrl(product),
      promotion_name: product.promotion_name,
    };
  });
}