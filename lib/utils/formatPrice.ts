export const formatPrice = (price: number | string | undefined | null): string => {
    if (price === undefined || price === null || price === "") return "0.00";
    const numPrice = typeof price === "string" ? Number.parseFloat(price) : price;
    if (Number.isNaN(numPrice)) return "0.00";
    return numPrice.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};
