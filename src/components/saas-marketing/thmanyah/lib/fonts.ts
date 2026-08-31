/**
 * Font family / weight data shared by the "Try" blocks. Every string is
 * copied verbatim from font.thmanyah.com (tatweel counts included — the
 * cards say "ثمانيــة" with two while the tester's select says "ثمانيـة").
 */

export type FamilyId = "display" | "text" | "sans"

export interface Family {
  id: FamilyId
  /** Card / accordion title */
  title: string
  /** Latin name under the title */
  latin: string
  /** One-line description */
  description: string
  /** CSS family name (the non-1.2 files) */
  css: string
  /** The reference only turns ss01 on for the display family's title */
  titleSs01: boolean
  /** Value shown in the tester's font select */
  selectLabel: string
}

export const FAMILIES: Family[] = [
  {
    id: "display",
    title: "خط ثمانيــة للعناوين",
    latin: "thmanyah Serif Display",
    description: "مثالي للعناوين، بتفاصيله الأنيقة المُلفتة.",
    css: "thmanyah serif display",
    titleSs01: true,
    selectLabel: "خط ثمانيـة للعناوين",
  },
  {
    id: "text",
    title: "خط ثمانيــة للنصوص",
    latin: "thmanyah Serif Text",
    description: "الخيار الأفضل للمقالات، بوضوحه وسهولة قراءته.",
    css: "thmanyah serif text",
    titleSs01: false,
    selectLabel: "خط ثمانيـة للنصوص",
  },
  {
    id: "sans",
    title: "خط ثمانيــة الرقمي",
    latin: "thmanyah Sans",
    description: "يتميّز بانعدام التباين وبساطة تناسب الشاشات الرقمية.",
    css: "thmanyah sans",
    titleSs01: false,
    selectLabel: "خط ثمانيـة الرقمي",
  },
]

export const BADGE = "5 أوزان"

export interface Weight {
  label: string
  value: 300 | 400 | 500 | 700 | 900
}

export const WEIGHTS: Weight[] = [
  { label: "رفيــــع", value: 300 },
  { label: "عادي", value: 400 },
  { label: "متوســط", value: 500 },
  { label: "سميــك", value: 700 },
  { label: "ثقيـــل", value: 900 },
]

export const SPECIMEN_AR =
  "نوثق قصصنــا، نروي أفكارنــا، نصنــع محتــوى يشبهنــا."
export const SPECIMEN_EN =
  "Our stories documented, our ideas told, our content crafted."

/* ── The platform's surfaces ────────────────────────────────────────────
   FAMILIES/WEIGHTS above still drive the type tester, which is a real
   typography control and keeps the font names. THIS section reuses the
   reference's families layout to say something about the product instead:
   three surfaces (cards) across five areas (rows), one line per cell, so
   picking a card glides every row to that surface's line — the reference's
   own justify-content trick, now carrying information.

   The three thmanyah faces are kept as the rendering vehicle (`css`) so the
   cards stay visually identical to the reference; only the words changed.
   `value` keeps the reference's 300→900 ramp, so the rows still darken down
   the column. */

export interface Surface {
  id: FamilyId
  /** Card title (Arabic) */
  title: string
  /** Latin name under the title */
  latin: string
  /** One-line description, shown on the active card only */
  description: string
  /** CSS family the card + its rows render in */
  css: string
  titleSs01: boolean
}

export const SURFACES: Surface[] = [
  {
    id: "display",
    title: "لوحة الإدارة",
    latin: "Admin Console",
    description: "الصورة الكاملة للمدرسة، من القبول إلى التقارير.",
    css: "thmanyah serif display",
    titleSs01: true,
  },
  {
    id: "text",
    title: "لوحة المعلّم",
    latin: "Teacher Workspace",
    description: "أدوات الصف اليومية، بأقل عدد من النقرات.",
    css: "thmanyah serif text",
    titleSs01: false,
  },
  {
    id: "sans",
    title: "بوابة وليّ الأمر",
    latin: "Guardian Portal",
    description: "متابعة واضحة لابنه، دون أن يتصل بالمدرسة.",
    css: "thmanyah sans",
    titleSs01: false,
  },
]

export const SURFACES_BADGE = "5 مجالات"

export interface AreaLine {
  ar: string
  en: string
}

export interface Area {
  label: string
  /** The reference's weight ramp — the rows still darken down the column */
  value: 300 | 400 | 500 | 700 | 900
  lines: Record<FamilyId, AreaLine>
}

export const AREAS: Area[] = [
  {
    label: "القبــول",
    value: 300,
    lines: {
      display: {
        ar: "طلبات الالتحاق تصل مرتّبة، وتُقبل أو تُؤجّل بضغطة.",
        en: "Applications arrive sorted, accepted or deferred in a click.",
      },
      text: {
        ar: "الطالب الجديد يظهر في كشف الصف قبل أول حصة.",
        en: "A new student is on the class list before the first period.",
      },
      sans: {
        ar: "يقدّم الطلب من هاتفه، ويتابع حالته خطوة بخطوة.",
        en: "Apply from a phone, then follow the request step by step.",
      },
    },
  },
  {
    label: "الحضــور",
    value: 400,
    lines: {
      display: {
        ar: "نسبة الحضور اليومية أمامك، ومعها كل غيابٍ متكرّر.",
        en: "Daily attendance in front of you, repeated absence flagged.",
      },
      text: {
        ar: "يرصد الحضور في ثوانٍ، من الجوال أو من الشاشة.",
        en: "Attendance taken in seconds, from a phone or a screen.",
      },
      sans: {
        ar: "يصله إشعار الغياب في صباحه، لا في آخر الشهر.",
        en: "The absence notice arrives that morning, not at month end.",
      },
    },
  },
  {
    label: "الدرجــات",
    value: 500,
    lines: {
      display: {
        ar: "تتابع اكتمال الرصد لكل صفٍّ ومادة قبل الاعتماد.",
        en: "Track grading progress per class and subject before approval.",
      },
      text: {
        ar: "يرصد الدرجات، ويحسب المعدّل، ويصدر الكشف من مكان.",
        en: "Enter marks, compute averages, export the sheet in one place.",
      },
      sans: {
        ar: "يرى درجات ابنه ومستواه في كل مادة أولًا بأول.",
        en: "See a child's marks and standing in each subject as they land.",
      },
    },
  },
  {
    label: "الرســوم",
    value: 700,
    lines: {
      display: {
        ar: "تعرف المحصّل والمتبقّي لحظة بلحظة، بلا جدولٍ جانبي.",
        en: "Know what is collected and what is due, with no spreadsheet.",
      },
      text: {
        ar: "لا يتدخّل في المال، ولا يُقاطَع بسؤالٍ عن فاتورة.",
        en: "Stays out of billing, and out of questions about invoices.",
      },
      sans: {
        ar: "تصله الفاتورة، ويدفعها أونلاين، ويحتفظ بالإيصال.",
        en: "The invoice arrives, is paid online, the receipt is kept.",
      },
    },
  },
  {
    label: "التقاريــر",
    value: 900,
    lines: {
      display: {
        ar: "تقرير المدرسة يُبنى من بيانات اليوم، جاهزًا للقرار.",
        en: "The school report builds from today's data, ready to act on.",
      },
      text: {
        ar: "تقرير الصف جاهز في دقيقة، بلا نسخٍ ولا تجميع.",
        en: "A class report ready in a minute, no copying or collating.",
      },
      sans: {
        ar: "يستلم تقريرًا واضحًا عن الفصل كاملًا، بلغته.",
        en: "Receives a clear report for the whole term, in their language.",
      },
    },
  },
]

/** Framer's default variant-transition spring, fitted against the live
 *  row/card motion (25% travelled at 50ms, 94% at 150ms, tiny overshoot). */
export const FRAMER_SPRING = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
  mass: 1,
}

/** The reference's scroll-reveal spring, fitted off the live curves (28.1px
 *  of 60 remaining at 286ms, 4.9 at 784ms, 0.55 at 1.4s — all within 1.5px
 *  of the samples). Every reveal target starts once about half of it is in
 *  view. */
export const REVEAL_SPRING = {
  type: "spring" as const,
  stiffness: 158,
  damping: 55,
  mass: 2.9,
}

export function reveal(y = 60, amount = 0.5) {
  return {
    initial: { opacity: 0.001, y, transformPerspective: 1200 },
    whileInView: { opacity: 1, y: 0, transformPerspective: 1200 },
    viewport: { once: true, amount } as const,
    transition: REVEAL_SPRING,
  }
}
