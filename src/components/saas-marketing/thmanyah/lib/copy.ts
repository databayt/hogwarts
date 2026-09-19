"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { createContext, useContext } from "react"

/**
 * Every word the thmanyah-clone homepage says, in both locales.
 *
 * The page used to be Arabic at every locale — `dir` and `lang` were pinned
 * on the shell because the reference (font.thmanyah.com) has no English
 * variant, and the copy lived as literals inside each block. `/en` therefore
 * served an Arabic RTL page. This module is the one place those literals
 * moved to, so the same component tree renders either language.
 *
 * Why here and not the shared dictionary (`internationalization/*.json`):
 * every block on this page is `"use client"`, and threading the dictionary
 * into a client tree ships it in the RSC payload — measured at ~95 % of the
 * HTML weight on other surfaces of this app. This file is tree-shaken per
 * locale only in the sense that it is small; more importantly it is
 * co-located with the blocks that read it, the way `fonts.ts` already
 * co-locates the specimen data.
 *
 * ARABIC IS THE REFERENCE. Every `ar` string below is the literal that used
 * to sit in the block, character for character — tatweel counts included,
 * because the Arabic headline/CTA/label widths were tuned against the
 * reference's own boxes (see the notes in HeroBlock and DownloadCtaBlock).
 * Do not "clean up" a tatweel here; it is load-bearing geometry.
 *
 * The English is written natively, not translated word-for-word, and is
 * length-matched where a box is fixed:
 *   · `trials.ledes` — `.trials-lede-box` is a fixed 60px below 810px, which
 *     is exactly two lines at 20px/1.5em, and `.trials-title` is
 *     `overflow: clip`. Keep every lede under ~68 characters.
 *   · `hero.words` + `hero.highlight` — five flex items plus the marked
 *     group, so the headline wraps to the same line count as `/ar`.
 *   · `footer.ctaLabel` — the pill's width comes from an invisible helper
 *     copy of this exact string.
 */

export type ThmanyahLang = "ar" | "en"

/** One run of an FAQ answer: plain text, faux-bold, or a link. */
export type AnswerPart =
  | string
  | { bold: string }
  | { link: string; href: string }

export interface FaqItem {
  q: string
  a: AnswerPart[]
  /** `.faq-a--right` — the reference right-aligns this one answer. */
  flush?: boolean
}

export interface ThmanyahCopy {
  hero: {
    /** The brand line above the headline. */
    eyebrow: string
    /** Headline, one flex item per entry. */
    words: string[]
    /** The marked (highlighted) tail of the headline. */
    highlight: string
    cta: string
  }
  answer: {
    /** Row A — the two opening paragraphs, split on the blank line. */
    a: [string, string]
    /** Row B — body then the emphasised closing sentence. */
    bBody: string
    bBold: string
  }
  trials: {
    eyebrow: string
    headline: string
    /** Cycled one at a time; keep each under ~68 characters. */
    ledes: string[]
    stats: Array<{ prefix: string; number: string; description: string }>
  }
  aseel: {
    eyebrow: string
    headline: string
    lede: string
    before: string
    after: string
  }
  surfaces: {
    badge: string
    /** Keyed by `Surface.id` — see `fonts.ts`. */
    cards: Record<
      "display" | "text" | "sans",
      { title: string; latin: string; description: string }
    >
    /** Keyed by the area's index in `AREAS`. */
    areas: string[]
  }
  tester: {
    font: string
    weight: string
    alignment: string
    stylisticSet: string
    /** Menu labels for the 300→900 ramp. */
    weights: string[]
    /** The editable specimen the panel opens with. */
    specimen: string
  }
  modern: {
    eyebrow: string
    headline: string
    lede: string
  }
  faq: {
    /** Two title lines; the second's `mark` gets the ss01 span. */
    titleLine1: string
    titleLine2Lead: string
    titleLine2Mark: string
    /** Three columns, in render order. */
    columns: FaqItem[][]
  }
  footer: {
    ctaLine1: string
    ctaLine2: string
    ctaLabel: string
    /** "<brand> by <maker>" — `maker` is the underlined half. */
    wordmarkLead: string
    wordmarkMaker: string
  }
}

const AR: ThmanyahCopy = {
  hero: {
    eyebrow: "منصة بالقلم",
    /* Width-tuned with tatweel against the reference's own flex items at
       92px — see the table in HeroBlock's header. */
    words: ["نظام", "واحد", "يُدير", "أعمـال", "المدرسـة"],
    highlight: "والتعليـم معًا",
    cta: "جرّب المنصة الآن",
  },
  answer: {
    a: [
      "الارتقاء بأداء المؤسسة التعليمية يبدأ من توحيد جميع تفاصيل العمل في مكان واحد. منصة إلكترونية متكاملة تجمع العمليات الإدارية، الأكاديمية، والمالية تحت سقف واحد، لتبسّط إدارة المدرسة، وتنظّم عملياتها، وتربط جميع أطرافها ضمن تجربة أكثر سلاسة ووضوحًا.",
      "فبدل أن تتوزّع تفاصيل اليوم بين سجلٍّ للحضور، ودفترٍ للدرجات، وملفٍّ للرسوم، تصبح جميعها في مكان واحد، مترابطةً ومحدّثةً، لينتقل الجهد من جمع البيانات إلى فهمها، ومن متابعة التفاصيل إلى اتخاذ القرار.",
    ],
    /* The trailing U+00A0 lives inside the text node, as the reference has
       it, so the rendered h2 has exactly two child nodes. */
    bBody:
      "منظومة موحدة تمنح الإدارة تحكّمًا كاملاً ورؤية دقيقة، وتمنح المعلّمين أدوات أكثر كفاءة، وأولياء الأمور تجربة أكثر سهولة ووضوحًا. فالحضور والدرجات والجداول والرسوم تعمل على قاعدةٍ واحدة، فما يُسجَّل في الصف صباحًا يظهر في تقرير الإدارة ولوحة وليّ الأمر فورًا، بلا نسخٍ ولا تكرار. وتبقى المدرسة تعمل بلغتها وتقويمها ونظام درجاتها، لا بقوالب جاهزة تُفرض عليها. ",
    bBold:
      "كل ما تحتاجه المدرسة لإدارة يومها، ومتابعة أدائها، واتخاذ قراراتها، في منصة واحدة.",
  },
  trials: {
    eyebrow: "رحلة بناء",
    headline: "منظومة عربية غير مسبوقة",
    ledes: [
      "صُمِّمت من اليمين إلى اليسار منذ أول سطر.",
      "من شاشة الهاتف إلى شاشة المكتب، الواجهة نفسها كاملة.",
      "تعمل دون اتصال، وتُزامن ما أُنجز حين تعود الشبكة.",
    ],
    stats: [
      {
        prefix: "أكثر من",
        number: "60",
        description: "وحدة تغطي يوم المدرسة، من القبول إلى التقارير.",
      },
      {
        prefix: "أكثر من",
        number: "300",
        description: "نموذج بيانات تقوم عليها سجلات المدرسة وتقاريرها.",
      },
      {
        prefix: "تعمل بـ",
        number: "8",
        description: "أدوار، لكل دورٍ لوحته وما يخصّه وحده.",
      },
    ],
  },
  aseel: {
    eyebrow: "سجلٌّ أصيل",
    headline: "كما لو أن الورق لم يتغيّر.",
    lede: "يجمع بين أُلفة الورق ودقّة النظام، فلا يضيع سطرٌ ولا يُعاد كتابته.",
    before: "بالورق والدفاتر",
    after: "بمنظومة بالقلم",
  },
  surfaces: {
    badge: "5 مجالات",
    cards: {
      display: {
        title: "لوحة الإدارة",
        latin: "Admin Console",
        description: "الصورة الكاملة للمدرسة، من القبول إلى التقارير.",
      },
      text: {
        title: "لوحة المعلّم",
        latin: "Teacher Workspace",
        description: "أدوات الصف اليومية، بأقل عدد من النقرات.",
      },
      sans: {
        title: "بوابة وليّ الأمر",
        latin: "Guardian Portal",
        description: "متابعة واضحة لابنه، دون أن يتصل بالمدرسة.",
      },
    },
    areas: ["القبــول", "الحضــور", "الدرجــات", "الرســوم", "التقاريــر"],
  },
  tester: {
    font: "الخط",
    weight: "الوزن",
    alignment: "المحاذاة",
    stylisticSet: "الحروف مرسلة",
    weights: ["رفيــــع", "عادي", "متوســط", "سميــك", "ثقيـــل"],
    specimen:
      "منظومة حيّة؛ تُنظّم يوم المدرسة.\nمن أول حصة إلى آخر تقرير، يبقى كل رقم في مكانه، ويرى كل طرفٍ ما يخصّه وحده.",
  },
  modern: {
    eyebrow: "نظام حديث",
    headline: "يصنع توازنًا مريحًا لمدرستك",
    lede: "تفهمه من النظرة الأولى، يجمع بين الوضوح والسرعة، بلمسة هادئة تُبرز ما يهمّ.",
  },
  faq: {
    titleLine1: "أسئلــة قد",
    titleLine2Lead: "تخطــر ",
    titleLine2Mark: "ببالك",
    columns: [
      [
        {
          q: "هل يعمل النظام عند انقطاع الإنترنت؟",
          a: [
            "نعم. الدروس المحمّلة تبقى متاحة، وما يُسجَّل أثناء الانقطاع — حضورٌ أو درجة — يُحفظ على الجهاز ثم ",
            { bold: "يُزامَن تلقائيًا" },
            " فور عودة الشبكة، دون إعادة إدخال.",
          ],
        },
        {
          q: "كيف ننتقل من نظامنا الحالي؟",
          a: [
            "نوفّر عملية ترحيل موجّهة مع أخصائي مخصّص لمدرستك: استيراد جماعي من Excel أو CSV أو نظامك الحالي، ثم فترة تشغيل متوازية للتحقّق من دقّة البيانات قبل الاعتماد. تكتمل عادةً خلال أسبوع إلى أسبوعين، بلا فقدان أي بيانات.",
          ],
        },
      ],
      [
        {
          q: "هل بيانات مدرستنا آمنة؟",
          a: [
            "الأمان أولويتنا الأولى: تشفير كامل للبيانات أثناء النقل والتخزين، وتحكّم بالوصول حسب الأدوار، ونسخ احتياطي يومي تلقائي مع إمكانية الاسترجاع لنقطة زمنية محدّدة، وتسجيل كامل لكل عملية إدارية.",
          ],
        },
        {
          q: "هل يتكامل مع الأدوات التي نستخدمها؟",
          a: [
            "نعم. تسجيل دخول موحّد عبر ",
            { bold: "«Google Workspace»" },
            " و",
            { bold: "«Microsoft 365»" },
            "، وتكامل مع منصات التعلّم وبوابات الدفع لتحصيل الرسوم، وواجهة برمجة مفتوحة لأي نظام آخر.",
          ],
        },
        {
          q: "ما الدعم والتدريب الذي تقدّمونه؟",
          flush: true,
          a: [
            "قنوات دعم متعدّدة تساعد فريقك على البدء بسرعة، مع أدلّة الاستخدام في ",
            { link: "التوثيق", href: "/docs" },
            ".",
          ],
        },
      ],
      [
        {
          q: "هل يمكن تخصيصه حسب منهجنا الدراسي؟",
          a: [
            "بالتأكيد. يدعم المناهج الوطنية والدولية والمخصّصة، بمقاييس درجات وأنواع تقييم قابلة للتخصيص، وكشوف درجات وشهادات محلّية، وواجهة بالعربية والإنجليزية مع دعم كامل للاتجاه من اليمين إلى اليسار.",
          ],
        },
        {
          q: "هل يمكننا إدارة عدة مدارس من نظام واحد؟",
          a: [
            "نعم. لوحة تحكّم واحدة لإدارة كل مدارسك، مع تخصيص لكل مدرسة في الهوية والمنهج والسياسات، وتقارير موحّدة عبر الشبكة بالكامل، وإدارة مركزية للمستخدمين بصلاحيات على مستوى المدرسة.",
          ],
        },
      ],
    ],
  },
  footer: {
    ctaLine1: "من السهل أن تبـدأ مع",
    ctaLine2: "منصـة بالقلم",
    ctaLabel: "ابدأ الآن معنا",
    wordmarkLead: "بالقلم من ",
    wordmarkMaker: "داتابيت",
  },
}

const EN: ThmanyahCopy = {
  hero: {
    eyebrow: "The balqalam platform",
    words: ["One", "system", "runs", "your", "school"],
    highlight: "and its teaching",
    cta: "Try the platform now",
  },
  answer: {
    a: [
      "Raising a school's performance starts by bringing every detail of the work into one place. One platform gathers the administrative, academic and financial sides of the institution under a single roof — simplifying how the school is run, ordering its operations, and connecting everyone involved in one clearer, calmer experience.",
      "Instead of a day scattered across an attendance register, a grade book and a fees file, all of it sits in one place, linked and current — so the effort moves from collecting data to understanding it, and from chasing details to making decisions.",
    ],
    bBody:
      "One system gives administrators full control and a precise view, gives teachers sharper tools, and gives parents an easier, clearer experience. Attendance, grades, timetables and fees all run on a single base, so what a teacher records in class in the morning is in the head teacher's report and the parent's dashboard at once, with no copying and no re-entry. And the school keeps working in its own language, its own calendar and its own grading scheme, not in a template imposed on it. ",
    bBold:
      "Everything a school needs to run its day, follow its performance and make its decisions, in one platform.",
  },
  trials: {
    eyebrow: "How it was built",
    headline: "An Arabic-first system, without precedent",
    ledes: [
      "Laid out right-to-left from the very first line.",
      "Phone screen to desk screen, the same complete interface.",
      "Works offline, and syncs the moment the network is back.",
    ],
    stats: [
      {
        prefix: "More than",
        number: "60",
        description:
          "modules covering the school day, from admission to reports.",
      },
      {
        prefix: "More than",
        number: "300",
        description: "data models behind the school's records and reports.",
      },
      {
        prefix: "Built around",
        number: "8",
        description: "roles, each with its own dashboard and nothing else.",
      },
    ],
  },
  aseel: {
    eyebrow: "A familiar record",
    headline: "As if the paper never changed.",
    lede: "The ease of paper with the precision of a system — no line lost, and none written twice.",
    before: "On paper and in ledgers",
    after: "With balqalam",
  },
  surfaces: {
    badge: "5 areas",
    cards: {
      display: {
        title: "Admin Console",
        latin: "For the school office",
        description: "The whole school at a glance, from admission to reports.",
      },
      text: {
        title: "Teacher Workspace",
        latin: "For the classroom",
        description: "The daily classroom tools, in the fewest clicks.",
      },
      sans: {
        title: "Guardian Portal",
        latin: "For families",
        description:
          "Clear progress for their child, without calling the school.",
      },
    },
    areas: ["Admission", "Attendance", "Grades", "Fees", "Reports"],
  },
  tester: {
    font: "Font",
    weight: "Weight",
    alignment: "Alignment",
    stylisticSet: "Swash letters",
    weights: ["Light", "Regular", "Medium", "Bold", "Black"],
    specimen:
      "A living system; it orders the school day.\nFrom the first period to the final report, every number stays in its place, and each person sees only what is theirs.",
  },
  modern: {
    eyebrow: "A modern system",
    headline: "It strikes a calm balance for your school",
    lede: "Understood at first glance — clarity and speed together, with a quiet touch that brings what matters forward.",
  },
  faq: {
    titleLine1: "Questions you",
    titleLine2Lead: "might ",
    titleLine2Mark: "have",
    columns: [
      [
        {
          q: "Does it work when the internet drops?",
          a: [
            "Yes. Downloaded lessons stay available, and anything recorded during the outage — attendance or a grade — is saved on the device and then ",
            { bold: "synced automatically" },
            " the moment the network returns, with nothing re-entered.",
          ],
        },
        {
          q: "How do we move off our current system?",
          a: [
            "We run a guided migration with a specialist assigned to your school: bulk import from Excel, CSV or your existing system, then a parallel period to verify the data before you commit to it. It usually completes within one to two weeks, with no data lost.",
          ],
        },
      ],
      [
        {
          q: "Is our school's data safe?",
          a: [
            "Security comes first: full encryption in transit and at rest, role-based access control, automatic daily backups with point-in-time restore, and a complete audit trail of every administrative action.",
          ],
        },
        {
          q: "Does it integrate with the tools we already use?",
          a: [
            "Yes. Single sign-on through ",
            { bold: "“Google Workspace”" },
            " and ",
            { bold: "“Microsoft 365”" },
            ", integration with learning platforms and with payment gateways for fee collection, and an open API for anything else.",
          ],
        },
        {
          q: "What support and training do you provide?",
          flush: true,
          a: [
            "Several support channels get your team going quickly, with the how-to guides in the ",
            { link: "documentation", href: "/docs" },
            ".",
          ],
        },
      ],
      [
        {
          q: "Can it be tailored to our curriculum?",
          a: [
            "Absolutely. National, international and custom curricula are all supported, with configurable grading scales and assessment types, local report cards and certificates, and an interface in Arabic and English with full right-to-left support.",
          ],
        },
        {
          q: "Can we run several schools from one system?",
          a: [
            "Yes. One console for all of your schools, with per-school branding, curriculum and policy, unified reporting across the whole network, and central user management with school-level permissions.",
          ],
        },
      ],
    ],
  },
  footer: {
    ctaLine1: "It is easy to start with",
    ctaLine2: "balqalam",
    ctaLabel: "Get started",
    wordmarkLead: "balqalam by ",
    wordmarkMaker: "Databayt",
  },
}

export const COPY: Record<ThmanyahLang, ThmanyahCopy> = { ar: AR, en: EN }

export interface ThmanyahLocale {
  lang: ThmanyahLang
  dir: "rtl" | "ltr"
  rtl: boolean
  copy: ThmanyahCopy
}

function localeFor(lang: string): ThmanyahLocale {
  const l: ThmanyahLang = lang === "en" ? "en" : "ar"
  return {
    lang: l,
    dir: l === "en" ? "ltr" : "rtl",
    rtl: l !== "en",
    copy: COPY[l],
  }
}

/**
 * The route's locale, handed down from `HomeTemplate` rather than read from
 * `useParams`: the blocks render on the server first, and a context the
 * template already has the value for cannot disagree with the shell's `dir`.
 * Arabic is the fallback — it is the page's native language and the locale
 * `i18n.defaultLocale` resolves to.
 */
const ThmanyahLocaleContext = createContext<ThmanyahLocale>(localeFor("ar"))

export const ThmanyahLocaleProvider = ThmanyahLocaleContext.Provider

export function useThmanyahLocale(): ThmanyahLocale {
  return useContext(ThmanyahLocaleContext)
}

export { localeFor as thmanyahLocaleFor }
