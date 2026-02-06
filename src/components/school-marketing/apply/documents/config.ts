// Documents Step Configuration

export const DOCUMENTS_STEP_CONFIG = {
  id: "documents",
  label: "المستندات",
  description: "رفع المستندات المطلوبة",
}

export const DOCUMENT_TYPES = [
  {
    value: "birth_certificate",
    label: "شهادة الميلاد",
    required: true,
  },
  {
    value: "id_card",
    label: "بطاقة الهوية / جواز السفر",
    required: true,
  },
  {
    value: "previous_report",
    label: "تقرير المدرسة السابقة",
    required: false,
  },
  {
    value: "transfer_certificate",
    label: "شهادة النقل",
    required: false,
  },
  {
    value: "medical_certificate",
    label: "الشهادة الطبية",
    required: false,
  },
  {
    value: "other",
    label: "مستندات أخرى",
    required: false,
  },
] as const

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"]
