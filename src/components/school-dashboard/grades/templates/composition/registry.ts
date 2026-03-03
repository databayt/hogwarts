// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Certificate Variant Registry — maps each slot × variant to its component
 * Pattern mirrors the exam paper composition registry.
 */

import {
  AchievementBody,
  CustomBody,
  ReportSummaryBody,
  TranscriptBody,
} from "../body"
import {
  DatedFooter,
  MinimalFooter,
  NumberedFooter,
  VerificationFooter,
} from "../footer"
import {
  BilingualHeader,
  CrestHeader,
  MinimalHeader,
  MinistryHeader,
} from "../header"
import {
  CenteredRecipient,
  FramedRecipient,
  PhotoRecipient,
  UnderlineRecipient,
} from "../recipient"
import {
  BadgeRowScores,
  GaugeScores,
  HiddenScores,
  TableGridScores,
} from "../scores"
import {
  DualSignatures,
  SingleSignature,
  StampsSignatures,
  TripleSignatures,
} from "../signatures"
import {
  ArabicCalligraphyTitle,
  ClassicTitle,
  ElegantTitle,
  ModernTitle,
} from "../title"
import type { CertSlotName, CertVariantEntry } from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCertVariantEntry = CertVariantEntry<any>

export const CERT_VARIANT_REGISTRY: Record<
  CertSlotName,
  Record<string, AnyCertVariantEntry>
> = {
  header: {
    crest: {
      component: CrestHeader,
      label: { en: "Crest", ar: "شعار" },
      description: {
        en: "Large centered school crest",
        ar: "شعار المدرسة الكبير في الوسط",
      },
    },
    ministry: {
      component: MinistryHeader,
      label: { en: "Ministry", ar: "وزاري" },
      description: {
        en: "Dual-logo government style",
        ar: "نمط حكومي بشعارين",
      },
    },
    bilingual: {
      component: BilingualHeader,
      label: { en: "Bilingual", ar: "ثنائي اللغة" },
      description: {
        en: "Arabic + English side by side",
        ar: "عربي + إنجليزي جنباً إلى جنب",
      },
    },
    minimal: {
      component: MinimalHeader,
      label: { en: "Minimal", ar: "بسيط" },
      description: { en: "Name only, clean", ar: "الاسم فقط" },
    },
  },
  title: {
    elegant: {
      component: ElegantTitle,
      label: { en: "Elegant", ar: "أنيق" },
      description: { en: "Gold decorative lines", ar: "خطوط ذهبية زخرفية" },
    },
    modern: {
      component: ModernTitle,
      label: { en: "Modern", ar: "عصري" },
      description: { en: "Sans-serif, minimal", ar: "بسيط وعصري" },
    },
    classic: {
      component: ClassicTitle,
      label: { en: "Classic", ar: "كلاسيكي" },
      description: { en: "Traditional centered", ar: "تقليدي في الوسط" },
    },
    "arabic-calligraphy": {
      component: ArabicCalligraphyTitle,
      label: { en: "Arabic Calligraphy", ar: "خط عربي" },
      description: { en: "Arabic calligraphic style", ar: "نمط الخط العربي" },
    },
  },
  recipient: {
    centered: {
      component: CenteredRecipient,
      label: { en: "Centered", ar: "وسطي" },
      description: { en: "Centered name, large", ar: "اسم كبير في الوسط" },
    },
    underline: {
      component: UnderlineRecipient,
      label: { en: "Underline", ar: "مسطر" },
      description: { en: "Underlined name", ar: "اسم مسطر" },
    },
    framed: {
      component: FramedRecipient,
      label: { en: "Framed", ar: "مؤطر" },
      description: { en: "Bordered name box", ar: "اسم في إطار" },
    },
    photo: {
      component: PhotoRecipient,
      label: { en: "Photo", ar: "صورة" },
      description: { en: "Name with photo", ar: "اسم مع صورة" },
    },
  },
  body: {
    achievement: {
      component: AchievementBody,
      label: { en: "Achievement", ar: "إنجاز" },
      description: { en: "For achieving X in Y", ar: "تقديراً للتفوق في..." },
    },
    "report-summary": {
      component: ReportSummaryBody,
      label: { en: "Report Summary", ar: "ملخص التقرير" },
      description: { en: "Report card summary table", ar: "جدول ملخص التقرير" },
    },
    transcript: {
      component: TranscriptBody,
      label: { en: "Transcript", ar: "كشف" },
      description: { en: "Multi-subject transcript", ar: "كشف متعدد المواد" },
    },
    custom: {
      component: CustomBody,
      label: { en: "Custom", ar: "مخصص" },
      description: { en: "User-defined template", ar: "نموذج مخصص" },
    },
  },
  scores: {
    "badge-row": {
      component: BadgeRowScores,
      label: { en: "Badge Row", ar: "صف الشارات" },
      description: { en: "Horizontal badge row", ar: "صف شارات أفقي" },
    },
    "table-grid": {
      component: TableGridScores,
      label: { en: "Table Grid", ar: "جدول" },
      description: { en: "Table grid format", ar: "تنسيق جدولي" },
    },
    gauge: {
      component: GaugeScores,
      label: { en: "Gauge", ar: "مقياس" },
      description: { en: "Visual gauge/meter", ar: "مقياس بصري" },
    },
    hidden: {
      component: HiddenScores,
      label: { en: "Hidden", ar: "مخفي" },
      description: { en: "No scores shown", ar: "بدون درجات" },
    },
  },
  signatures: {
    dual: {
      component: DualSignatures,
      label: { en: "Dual", ar: "مزدوج" },
      description: { en: "Teacher + Principal", ar: "المعلم + المدير" },
    },
    triple: {
      component: TripleSignatures,
      label: { en: "Triple", ar: "ثلاثي" },
      description: {
        en: "Teacher + Principal + Ministry",
        ar: "المعلم + المدير + الوزارة",
      },
    },
    single: {
      component: SingleSignature,
      label: { en: "Single", ar: "فردي" },
      description: { en: "Single signature", ar: "توقيع واحد" },
    },
    stamps: {
      component: StampsSignatures,
      label: { en: "Stamps", ar: "أختام" },
      description: { en: "Stamp-style with seal", ar: "طابع مع ختم" },
    },
  },
  footer: {
    verification: {
      component: VerificationFooter,
      label: { en: "Verification", ar: "تحقق" },
      description: {
        en: "QR + cert number + date",
        ar: "رمز QR + رقم الشهادة + التاريخ",
      },
    },
    minimal: {
      component: MinimalFooter,
      label: { en: "Minimal", ar: "بسيط" },
      description: { en: "Date only", ar: "التاريخ فقط" },
    },
    dated: {
      component: DatedFooter,
      label: { en: "Dated", ar: "مؤرخ" },
      description: { en: "Prominent date", ar: "تاريخ بارز" },
    },
    numbered: {
      component: NumberedFooter,
      label: { en: "Numbered", ar: "مرقم" },
      description: { en: "Prominent cert number", ar: "رقم شهادة بارز" },
    },
  },
}
