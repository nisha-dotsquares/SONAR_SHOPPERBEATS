import * as yup from "yup";

/* ------------------ PASSWORD ------------------ */

export const strongPassword = yup
  .string()
  .required("New password is required")
  .min(8, "Password must be at least 8 characters")
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character and should be at least 8 characters"
  )

export const confirmPassword = (fieldName: string) =>
  yup
    .string()
    .oneOf([yup.ref(fieldName)], "Passwords must match")
    .required("Confirm Password is required");

/* ------------------ PHONE ------------------ */

export const phoneNumber = yup
  .string()
  .required("Phone number is required")
  .matches(
    /^(?:\+?61\s?|0)4\d{8}$/,
    "Enter a valid Australian mobile number (e.g. 0412345678 or +61412345678)"

  );

/* ------------------ EMAIL ------------------ */

export const email = yup.string()
  .email("Invalid email")
  .required("Email is required")
  .matches(/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/, "Email must contain a valid domain")

/* ------------------ COMMON TEXT ------------------ */

export const requiredString = (label: string) =>
  yup
    .string()
    .trim()
    .required(`${label} is required`);

/* ------------------ DOB  ------------------ */

export const dateOfBirth = yup
  .string()
  .nullable()
  .transform((value, originalValue) =>
    originalValue === "" ? null : value
  )
  .test(
    "not-in-future",
    "Date of Birth cannot be in the future",
    (value) => {
      if (!value) return true;
      return new Date(value) <= new Date();
    }
  );
/* ------------------ PINCODE  ------------------ */

export const pincode = yup
  .string()
  .required("Postcode is required")
  .matches(/^\d{4}$/, "Postcode must be 4 digits")
  .test("au-postcode", "Enter a valid Australian postcode", (value) => {
    if (!value) return false;
    const n = Number.parseInt(value, 10);
    return (
      (n >= 800 && n <= 999) ||   // NT (0800–0999)
      (n >= 1000 && n <= 2999) || // NSW / ACT
      (n >= 3000 && n <= 3999) || // VIC
      (n >= 4000 && n <= 4999) || // QLD
      (n >= 5000 && n <= 5999) || // SA
      (n >= 6000 && n <= 6999) || // WA
      (n >= 7000 && n <= 7999)    // TAS
    );
  });


/* ------------------ Name  ------------------ */

export const nameField = (label: string) =>
  yup
    .string()
    .trim()
    .required(`${label} is required`)
    .min(2, `${label} must be at least 2 characters`)
    .max(50, `${label} must be at most 50 characters`)
    .matches(/^[a-zA-Z\s]+$/, `${label} must contain only letters`);


/* ------------------ CURRENCY ------------------ */

export const currency = yup
  .string()
  .trim()
  .uppercase()
  .required("Currency is required")
  .matches(
    /^[A-Z]{3}$/,
    "Currency must be a valid 3-letter code (e.g. USD, EUR, INR)"
  );

/* ------------------ CREDIT LIMIT ------------------ */

export const creditLimit = yup
  .number()
  .typeError("Credit limit must be a number")
  .min(0, "Credit limit cannot be negative")
  .required("Credit limit is required");

/* ------------------ WEBSITE ------------------ */

export const website = yup
  .string()
  .trim()
  .nullable()
  .transform((value, originalValue) =>
    originalValue === "" ? null : value
  )
  .url("Website must be a valid URL");

/* ------------------ MESSAGE / NOTES ------------------ */

export const message = yup
  .string()
  .trim()
  .max(500, "Message cannot exceed 500 characters")
  .nullable();

export const requiredMessage = (label: string = "Message", min: number = 5) =>
  yup
    .string()
    .trim()
    .required(`${label} is required`)
    .min(min, `${label} must be at least ${min} characters long`)
    .max(500, `${label} cannot exceed 500 characters`);