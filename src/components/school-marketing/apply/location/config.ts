// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export const LOCATION_STEP_CONFIG = {
  id: "location",
  label: (isRTL: boolean) => (isRTL ? "العنوان" : "Location"),
  description: (isRTL: boolean) =>
    isRTL ? "أدخل عنوان إقامتك" : "Enter your residential address",
}
