// Contact Step Configuration

export const CONTACT_STEP_CONFIG = {
  id: "contact",
  label: (isRTL: boolean) =>
    isRTL ? "معلومات الاتصال" : "Contact Information",
  description: (isRTL: boolean) =>
    isRTL
      ? "أدخل تفاصيل الاتصال والعنوان"
      : "Enter contact details and address",
}

export const COUNTRY_OPTIONS = (isRTL: boolean) =>
  [
    { value: "SD", label: isRTL ? "السودان" : "Sudan" },
    { value: "EG", label: isRTL ? "مصر" : "Egypt" },
    { value: "SA", label: isRTL ? "السعودية" : "Saudi Arabia" },
    { value: "AE", label: isRTL ? "الإمارات" : "UAE" },
    { value: "JO", label: isRTL ? "الأردن" : "Jordan" },
    { value: "OTHER", label: isRTL ? "أخرى" : "Other" },
  ] as const
