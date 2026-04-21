// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Fees Step Configuration

export const FEES_STEP_CONFIG = {
  id: "fees",
  label: (isRTL: boolean) => (isRTL ? "الرسوم الدراسية" : "School Fees"),
  description: (isRTL: boolean) =>
    isRTL
      ? "الرسوم المقدرة وطرق الدفع المتاحة حسب الصف الدراسي"
      : "Estimated fees and available payment methods for the selected grade",
}
