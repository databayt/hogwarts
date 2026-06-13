// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Fees Step Configuration

export const FEES_STEP_CONFIG = {
  id: "fees",
  label: (isRTL: boolean) => (isRTL ? "الرسوم الدراسية" : "School Fees"),
  description: (isRTL: boolean) =>
    isRTL
      ? "معاينة الرسوم المتوقعة بعد القبول — التقديم مجاني تماماً"
      : "Preview of estimated fees after acceptance — applying is completely free",
}
