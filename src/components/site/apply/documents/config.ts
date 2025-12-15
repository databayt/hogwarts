// Documents Step Configuration

export const DOCUMENTS_STEP_CONFIG = {
  id: "documents",
  label: "Documents",
  labelAr: "المستندات",
  description: "Upload required documents",
  descriptionAr: "رفع المستندات المطلوبة",
}

export const DOCUMENT_TYPES = [
  {
    value: "birth_certificate",
    label: "Birth Certificate",
    labelAr: "شهادة الميلاد",
    required: true,
  },
  {
    value: "id_card",
    label: "ID Card / Passport",
    labelAr: "بطاقة الهوية / جواز السفر",
    required: true,
  },
  {
    value: "previous_report",
    label: "Previous School Report",
    labelAr: "تقرير المدرسة السابقة",
    required: false,
  },
  {
    value: "transfer_certificate",
    label: "Transfer Certificate",
    labelAr: "شهادة النقل",
    required: false,
  },
  {
    value: "medical_certificate",
    label: "Medical Certificate",
    labelAr: "الشهادة الطبية",
    required: false,
  },
  {
    value: "other",
    label: "Other Documents",
    labelAr: "مستندات أخرى",
    required: false,
  },
] as const

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"]
