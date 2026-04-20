const addBusinessDays = (date: Date, days: number) => {
  const result = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();

    if (day !== 0 && day !== 6) {
      addedDays++;
    }
  }

  return result;
};

const getEstimatedDeliveryRange = (
  location: string|undefined,
  handlingDays: number
) => {
  const today = new Date();

  let minShippingDays = 6;
  let maxShippingDays = 10;

  // Location-based shipping days
  if (location === "China" || location === "USA") {
    minShippingDays = 7;
    maxShippingDays = 15;
  } else if (location === "SBAU" || location === "Local 3PL") {
    minShippingDays = 6;
    maxShippingDays = 10;
  }

  //  Add handling time
  const minTotalDays = handlingDays + minShippingDays;
  const maxTotalDays = handlingDays + maxShippingDays;

  const startDate = addBusinessDays(today, minTotalDays);
  const endDate = addBusinessDays(today, maxTotalDays);

  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "2-digit",
    month: "short",
  };

  const formattedStart = startDate.toLocaleDateString("en-AU", options);
  const formattedEnd = endDate.toLocaleDateString("en-AU", options);

  return `Estimated delivery between ${formattedStart} - ${formattedEnd}`;
};

export default getEstimatedDeliveryRange;
