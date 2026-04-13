// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export const CONTACT_STEP_CONFIG = {
  id: "contact",
  label: (isRTL: boolean) => (isRTL ? "الدفع" : "Payment"),
  description: (isRTL: boolean) =>
    isRTL ? "الرسوم الدراسية وطريقة الدفع" : "School fees and payment method",
}
