// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Variant Registry — maps each slot × variant to its component
 * Pattern mirrors shadcn/ui's cva approach adapted for @react-pdf components.
 */

import { OmrAnswerSheet, StandardAnswerSheet } from "../answer-sheet"
import { GridAnswerSheet } from "../answer-sheet/grid"
import { StandardCover, TableOfContents } from "../cover"
import { MinistryCover } from "../cover/ministry"
import { DisclaimerFooter, StandardFooter } from "../footer"
import { GradingFooter } from "../footer/grading"
import { MinimalFooter } from "../footer/minimal"
import { MinimalHeader, MinistryHeader, StandardHeader } from "../header"
import { BilingualHeader } from "../header/bilingual"
import { CenteredHeader } from "../header/centered"
import { CompactInstructions, StandardInstructions } from "../instructions"
import { RulesInstructions } from "../instructions/rules"
import { SectionedInstructions } from "../instructions/sectioned"
import { BubbleIdStudentInfo, StandardStudentInfo } from "../student-info"
import { PhotoStudentInfo } from "../student-info/photo"
import { TableStudentInfo } from "../student-info/table"
import type { SlotName, VariantEntry } from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyVariantEntry = VariantEntry<any>

export const VARIANT_REGISTRY: Record<
  SlotName,
  Record<string, AnyVariantEntry>
> = {
  header: {
    standard: {
      component: StandardHeader,
      label: { en: "Standard", ar: "قياسي" },
      description: {
        en: "School logo + exam info",
        ar: "شعار المدرسة + معلومات الاختبار",
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
    minimal: {
      component: MinimalHeader,
      label: { en: "Minimal", ar: "بسيط" },
      description: {
        en: "Title-only for quizzes",
        ar: "العنوان فقط للاختبارات القصيرة",
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
    centered: {
      component: CenteredHeader,
      label: { en: "Centered", ar: "وسطي" },
      description: {
        en: "Logo centered above, info below",
        ar: "الشعار في الوسط والمعلومات أسفل",
      },
    },
  },
  footer: {
    standard: {
      component: StandardFooter,
      label: { en: "Standard", ar: "قياسي" },
      description: {
        en: "Page numbers + version + security hash",
        ar: "أرقام الصفحات + النسخة + رمز الأمان",
      },
    },
    disclaimer: {
      component: DisclaimerFooter,
      label: { en: "Disclaimer", ar: "إخلاء مسؤولية" },
      description: {
        en: "Standard + legal notice",
        ar: "قياسي + إشعار قانوني",
      },
    },
    minimal: {
      component: MinimalFooter,
      label: { en: "Minimal", ar: "بسيط" },
      description: { en: "Page number only", ar: "رقم الصفحة فقط" },
    },
    grading: {
      component: GradingFooter,
      label: { en: "Grading", ar: "تصحيح" },
      description: {
        en: "Grading rubric + examiner signatures",
        ar: "معايير التصحيح + توقيعات الممتحنين",
      },
    },
  },
  studentInfo: {
    standard: {
      component: StandardStudentInfo,
      label: { en: "Standard", ar: "قياسي" },
      description: {
        en: "Name/ID/Class/Date field lines",
        ar: "حقول الاسم/الرقم/الفصل/التاريخ",
      },
    },
    "bubble-id": {
      component: BubbleIdStudentInfo,
      label: { en: "Bubble ID", ar: "فقاعات الرقم" },
      description: {
        en: "OMR-scannable student ID",
        ar: "رقم الطالب بالفقاعات القابلة للمسح",
      },
    },
    table: {
      component: TableStudentInfo,
      label: { en: "Table", ar: "جدول" },
      description: { en: "Bordered table grid", ar: "جدول بحدود" },
    },
    photo: {
      component: PhotoStudentInfo,
      label: { en: "Photo", ar: "صورة" },
      description: {
        en: "Photo placeholder + fields",
        ar: "مكان الصورة + حقول البيانات",
      },
    },
  },
  instructions: {
    standard: {
      component: StandardInstructions,
      label: { en: "Standard", ar: "قياسي" },
      description: {
        en: "Numbered list + metadata",
        ar: "قائمة مرقمة + بيانات وصفية",
      },
    },
    compact: {
      component: CompactInstructions,
      label: { en: "Compact", ar: "مختصر" },
      description: { en: "Single-line summary", ar: "ملخص في سطر واحد" },
    },
    rules: {
      component: RulesInstructions,
      label: { en: "Rules", ar: "قواعد" },
      description: {
        en: "Exam rules emphasis with warnings",
        ar: "قواعد الاختبار مع تحذيرات",
      },
    },
    sectioned: {
      component: SectionedInstructions,
      label: { en: "Sectioned", ar: "مقسم" },
      description: { en: "Per-section instructions", ar: "تعليمات لكل قسم" },
    },
  },
  answerSheet: {
    standard: {
      component: StandardAnswerSheet,
      label: { en: "Standard", ar: "قياسي" },
      description: { en: "Answer lines in a grid", ar: "خطوط إجابة في شبكة" },
    },
    omr: {
      component: OmrAnswerSheet,
      label: { en: "OMR", ar: "مسح ضوئي" },
      description: {
        en: "Bubble sheet with alignment markers",
        ar: "ورقة فقاعات مع علامات محاذاة",
      },
    },
    grid: {
      component: GridAnswerSheet,
      label: { en: "Grid", ar: "شبكة" },
      description: {
        en: "Grid-based for math/graph",
        ar: "شبكة للرياضيات/الرسوم البيانية",
      },
    },
  },
  cover: {
    standard: {
      component: StandardCover,
      label: { en: "Standard", ar: "قياسي" },
      description: {
        en: "Logo, title, metadata, student info",
        ar: "الشعار والعنوان والبيانات",
      },
    },
    toc: {
      component: TableOfContents,
      label: { en: "Table of Contents", ar: "فهرس" },
      description: {
        en: "Section breakdown with counts",
        ar: "تفصيل الأقسام مع العدد",
      },
    },
    ministry: {
      component: MinistryCover,
      label: { en: "Ministry", ar: "وزاري" },
      description: {
        en: "Official ministry cover format",
        ar: "غلاف رسمي وزاري",
      },
    },
  },
}
