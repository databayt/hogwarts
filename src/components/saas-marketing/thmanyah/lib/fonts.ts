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
