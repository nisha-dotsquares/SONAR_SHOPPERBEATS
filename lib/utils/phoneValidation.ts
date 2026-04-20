export const handleAustralianPhoneNumberChange = (
  event: React.ChangeEvent<HTMLInputElement>,
  previousValue: string
): { value: string; error: string | null } => {
  let value = event.target.value;

  // Allow only digits and +
  if (!/^[0-9+]*$/.test(value)) {
    return { value: previousValue, error: "Only numbers and '+' allowed" };
  }

  // Only one +
  if ((value.match(/\+/g) || []).length > 1) {
    return { value: previousValue, error: "Only one '+' allowed" };
  }

  // First character must be 0 or +
  if (value.length === 1 && value !== "0" && value !== "+") {
    return { value: previousValue, error: "Must start with 04 or +61" };
  }

  // ===== LOCAL MOBILE FORMAT =====
  if (value.startsWith("0")) {
    // Allow typing 0 → 04 progressively
    if (value.length >= 2 && value[1] !== "4") {
      return { value: previousValue, error: "Australian mobile must start with 04" };
    }

    if (value.length > 10) {
      return { value: previousValue, error: null };
    }

    return { value, error: null };
  }

  // ===== INTERNATIONAL FORMAT =====
  if (value.startsWith("+")) {
    // Allow typing + → +6 → +61 progressively
    if (value.length >= 2 && value[1] !== "6") {
      return { value: previousValue, error: "Must start with +61" };
    }

    if (value.length >= 3 && value[2] !== "1") {
      return { value: previousValue, error: "Must start with +61" };
    }

    // After +61, next must be 4
    if (value.length >= 4 && value[3] !== "4") {
      return {
        value: previousValue,
        error: "Australian mobile must start with +614",
      };
    }

    if (value.length > 12) {
      return { value: previousValue, error: null };
    }

    return { value, error: null };
  }

  return { value, error: null };
};
