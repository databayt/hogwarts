// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useMemo } from "react"

import type { CertStepDefinition, CertWizardState } from "../types"

export function useCertWizardSteps(): CertStepDefinition[] {
  return useMemo(
    (): CertStepDefinition[] => [
      {
        id: "gallery",
        label: { en: "Regional Preset", ar: "النمط الإقليمي" },
        isComplete: () => true,
      },
      {
        id: "info",
        label: { en: "Certificate Info", ar: "معلومات الشهادة" },
        isComplete: (s) => s.name.trim().length > 0,
      },
      {
        id: "header",
        label: { en: "Header", ar: "الرأس" },
        isComplete: (s) => !!s.headerVariant,
      },
      {
        id: "title",
        label: { en: "Title", ar: "العنوان" },
        isComplete: (s) => !!s.titleVariant,
      },
      {
        id: "recipient",
        label: { en: "Recipient", ar: "المستلم" },
        isComplete: (s) => !!s.recipientVariant,
      },
      {
        id: "body",
        label: { en: "Body", ar: "المحتوى" },
        isComplete: (s) => !!s.bodyVariant,
      },
      {
        id: "scores",
        label: { en: "Scores", ar: "الدرجات" },
        isComplete: (s) => !!s.scoresVariant,
      },
      {
        id: "signatures",
        label: { en: "Signatures", ar: "التوقيعات" },
        isComplete: (s) => !!s.signaturesVariant,
      },
      {
        id: "footer",
        label: { en: "Footer", ar: "التذييل" },
        isComplete: (s) => !!s.footerVariant,
      },
      {
        id: "decorations",
        label: { en: "Decorations", ar: "الزخارف" },
        isComplete: () => true,
      },
      {
        id: "print",
        label: { en: "Page Setup", ar: "إعداد الصفحة" },
        isComplete: (s) => !!s.pageSize && !!s.orientation,
      },
      {
        id: "preview",
        label: { en: "Preview", ar: "معاينة" },
        isComplete: () => true,
      },
    ],
    []
  )
}
