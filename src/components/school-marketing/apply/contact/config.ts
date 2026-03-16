// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export const CONTACT_STEP_CONFIG = {
  id: "contact",
  label: (isRTL: boolean) =>
    isRTL ? "معلومات الاتصال" : "Contact Information",
  description: (isRTL: boolean) =>
    isRTL
      ? "أدخل بريدك الإلكتروني ورقم هاتفك"
      : "Enter your email and phone number",
}
