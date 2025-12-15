export const LOCATION_MESSAGES = {
  ADDRESS_REQUIRED: "Street address is required",
  CITY_REQUIRED: "City is required",
  STATE_REQUIRED: "State/Province is required",
  COUNTRY_REQUIRED: "Country is required",
  POSTAL_CODE_REQUIRED: "Postal code is required",
  INVALID_ADDRESS: "Please enter a valid address",
  GEOCODING_ERROR: "Could not find location. Please check the address",
} as const

export const SUPPORTED_COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
] as const
