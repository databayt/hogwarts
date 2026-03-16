// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export const ATTACHMENTS_STEP_CONFIG = {
  id: "attachments",
  label: (isRTL: boolean) => (isRTL ? "المرفقات" : "Attachments"),
  description: (isRTL: boolean) =>
    isRTL ? "ارفع الصورة الشخصية والمستندات" : "Upload photo and documents.",
}
