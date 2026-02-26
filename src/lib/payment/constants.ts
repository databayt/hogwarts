// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { PaymentGateway } from "./types"

/**
 * Display configuration for each payment gateway.
 * Bilingual labels (ar/en) and lucide icon names.
 */
export const GATEWAY_DISPLAY: Record<
  PaymentGateway,
  {
    icon: string
    label: { ar: string; en: string }
    description: { ar: string; en: string }
  }
> = {
  stripe: {
    icon: "CreditCard",
    label: { ar: "بطاقة ائتمان", en: "Credit/Debit Card" },
    description: {
      ar: "ادفع بأمان ببطاقة الائتمان أو الخصم",
      en: "Pay securely with credit or debit card",
    },
  },
  tap: {
    icon: "CreditCard",
    label: { ar: "مدى / بطاقة", en: "mada / Card" },
    description: {
      ar: "ادفع بمدى أو بطاقة ائتمان أو Apple Pay",
      en: "Pay with mada, credit card, or Apple Pay",
    },
  },
  cash: {
    icon: "Banknote",
    label: { ar: "الدفع نقدا", en: "Pay in Cash" },
    description: {
      ar: "ادفع نقدا في مقر المؤسسة",
      en: "Pay in cash at the institution",
    },
  },
  bank_transfer: {
    icon: "Building2",
    label: { ar: "تحويل بنكي", en: "Bank Transfer" },
    description: {
      ar: "حول المبلغ إلى الحساب البنكي",
      en: "Transfer to the bank account",
    },
  },
  mobile_money: {
    icon: "Smartphone",
    label: { ar: "محفظة إلكترونية", en: "Mobile Money" },
    description: {
      ar: "ادفع عبر بنكك أو mBOK",
      en: "Pay via Bankak or mBOK",
    },
  },
}

/**
 * Context display labels for different payment flows.
 */
export const CONTEXT_LABELS: Record<string, { ar: string; en: string }> = {
  admission_fee: { ar: "رسوم التقديم", en: "Application Fee" },
  saas_subscription: { ar: "اشتراك المنصة", en: "Platform Subscription" },
  tuition_fee: { ar: "الرسوم الدراسية", en: "Tuition Fee" },
  school_fee: { ar: "رسوم مدرسية", en: "School Fee" },
  salary_payout: { ar: "صرف راتب", en: "Salary Payout" },
  course_enrollment: { ar: "تسجيل في دورة", en: "Course Enrollment" },
}
