// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export type PeriodType = "class" | "break" | "lunch"

export interface StructurePeriod {
  name: string
  startTime: string
  endTime: string
  type: PeriodType
  durationMinutes: number
}

export interface TimetableStructure {
  slug: string
  name: string
  /** @deprecated Use name + lang pattern instead */
  nameEn?: string
  description: string
  /** @deprecated Use description + lang pattern instead */
  descriptionEn?: string
  lang: string
  country: string
  schoolType: string[]
  schoolLevel: string[]
  workingDays: number[]
  periods: StructurePeriod[]
  lunchAfterPeriod: number | null
  periodsPerDay: number
  schoolStart: string
  schoolEnd: string
  isDefault: boolean
  sortOrder: number
}

export const TIMETABLE_STRUCTURES: TimetableStructure[] = [
  {
    slug: "sd-gov-default",
    name: "الجدول الحكومي السوداني",
    nameEn: "Sudan Government Default",
    description: "٨ حصص × ٤٥ دقيقة، الأحد - الخميس",
    descriptionEn: "8 periods x 45min, Sun-Thu, standard ministry structure",
    lang: "ar",
    country: "SD",
    schoolType: ["public", "national"],
    schoolLevel: ["primary", "secondary", "both"],
    workingDays: [0, 1, 2, 3, 4], // Sun-Thu
    periods: [
      {
        name: "Period 1",
        startTime: "07:30",
        endTime: "08:15",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Period 2",
        startTime: "08:20",
        endTime: "09:05",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Period 3",
        startTime: "09:10",
        endTime: "09:55",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Break",
        startTime: "09:55",
        endTime: "10:15",
        type: "break",
        durationMinutes: 20,
      },
      {
        name: "Period 4",
        startTime: "10:15",
        endTime: "11:00",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Period 5",
        startTime: "11:05",
        endTime: "11:50",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Lunch",
        startTime: "11:50",
        endTime: "12:30",
        type: "lunch",
        durationMinutes: 40,
      },
      {
        name: "Period 6",
        startTime: "12:30",
        endTime: "13:15",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Period 7",
        startTime: "13:20",
        endTime: "14:05",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Period 8",
        startTime: "14:10",
        endTime: "14:55",
        type: "class",
        durationMinutes: 45,
      },
    ],
    lunchAfterPeriod: 5,
    periodsPerDay: 8,
    schoolStart: "07:30",
    schoolEnd: "14:55",
    isDefault: true,
    sortOrder: 1,
  },
  {
    slug: "sd-private",
    name: "المدارس الخاصة السودانية",
    nameEn: "Sudan Private",
    description: "٧ حصص × ٥٠ دقيقة، الأحد - الخميس",
    descriptionEn: "7 periods x 50min, Sun-Thu, private school schedule",
    lang: "ar",
    country: "SD",
    schoolType: ["private"],
    schoolLevel: ["primary", "secondary", "both"],
    workingDays: [0, 1, 2, 3, 4], // Sun-Thu
    periods: [
      {
        name: "Period 1",
        startTime: "07:15",
        endTime: "08:05",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Period 2",
        startTime: "08:10",
        endTime: "09:00",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Period 3",
        startTime: "09:05",
        endTime: "09:55",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Break",
        startTime: "09:55",
        endTime: "10:15",
        type: "break",
        durationMinutes: 20,
      },
      {
        name: "Period 4",
        startTime: "10:15",
        endTime: "11:05",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Period 5",
        startTime: "11:10",
        endTime: "12:00",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Lunch",
        startTime: "12:00",
        endTime: "12:40",
        type: "lunch",
        durationMinutes: 40,
      },
      {
        name: "Period 6",
        startTime: "12:40",
        endTime: "13:30",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Period 7",
        startTime: "13:35",
        endTime: "14:25",
        type: "class",
        durationMinutes: 50,
      },
    ],
    lunchAfterPeriod: 5,
    periodsPerDay: 7,
    schoolStart: "07:15",
    schoolEnd: "14:25",
    isDefault: false,
    sortOrder: 2,
  },
  {
    slug: "sd-british",
    name: "المنهج البريطاني",
    nameEn: "British Curriculum",
    description: "٦ حصص × ٥٥ دقيقة، الاثنين - الجمعة",
    descriptionEn: "6 periods x 55min, Mon-Fri, IGCSE/A-Levels structure",
    lang: "ar",
    country: "SD",
    schoolType: ["british", "international"],
    schoolLevel: ["primary", "secondary", "both"],
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
    periods: [
      {
        name: "Period 1",
        startTime: "08:00",
        endTime: "08:55",
        type: "class",
        durationMinutes: 55,
      },
      {
        name: "Period 2",
        startTime: "09:00",
        endTime: "09:55",
        type: "class",
        durationMinutes: 55,
      },
      {
        name: "Break",
        startTime: "09:55",
        endTime: "10:15",
        type: "break",
        durationMinutes: 20,
      },
      {
        name: "Period 3",
        startTime: "10:15",
        endTime: "11:10",
        type: "class",
        durationMinutes: 55,
      },
      {
        name: "Period 4",
        startTime: "11:15",
        endTime: "12:10",
        type: "class",
        durationMinutes: 55,
      },
      {
        name: "Lunch",
        startTime: "12:10",
        endTime: "12:50",
        type: "lunch",
        durationMinutes: 40,
      },
      {
        name: "Period 5",
        startTime: "12:50",
        endTime: "13:45",
        type: "class",
        durationMinutes: 55,
      },
      {
        name: "Period 6",
        startTime: "13:50",
        endTime: "14:45",
        type: "class",
        durationMinutes: 55,
      },
    ],
    lunchAfterPeriod: 4,
    periodsPerDay: 6,
    schoolStart: "08:00",
    schoolEnd: "14:45",
    isDefault: false,
    sortOrder: 3,
  },
  {
    slug: "sd-ib",
    name: "البكالوريا الدولية / أمريكي",
    nameEn: "IB / American",
    description: "٦ حصص × ٥٠ دقيقة، الاثنين - الجمعة",
    descriptionEn: "6 periods x 50min, Mon-Fri, IB/American structure",
    lang: "ar",
    country: "SD",
    schoolType: ["ib", "american"],
    schoolLevel: ["primary", "secondary", "both"],
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
    periods: [
      {
        name: "Period 1",
        startTime: "08:00",
        endTime: "08:50",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Period 2",
        startTime: "08:55",
        endTime: "09:45",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Break",
        startTime: "09:45",
        endTime: "10:05",
        type: "break",
        durationMinutes: 20,
      },
      {
        name: "Period 3",
        startTime: "10:05",
        endTime: "10:55",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Period 4",
        startTime: "11:00",
        endTime: "11:50",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Lunch",
        startTime: "11:50",
        endTime: "12:30",
        type: "lunch",
        durationMinutes: 40,
      },
      {
        name: "Period 5",
        startTime: "12:30",
        endTime: "13:20",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Period 6",
        startTime: "13:25",
        endTime: "14:15",
        type: "class",
        durationMinutes: 50,
      },
    ],
    lunchAfterPeriod: 4,
    periodsPerDay: 6,
    schoolStart: "08:00",
    schoolEnd: "14:15",
    isDefault: false,
    sortOrder: 4,
  },
  {
    slug: "sd-half-day",
    name: "نصف يوم / رياض أطفال",
    nameEn: "Half Day / KG",
    description: "٥ حصص × ٤٠ دقيقة، الأحد - الخميس",
    descriptionEn: "5 periods x 40min, Sun-Thu, kindergarten/half-day",
    lang: "ar",
    country: "SD",
    schoolType: ["public", "private", "national"],
    schoolLevel: ["primary"],
    workingDays: [0, 1, 2, 3, 4], // Sun-Thu
    periods: [
      {
        name: "Period 1",
        startTime: "08:00",
        endTime: "08:40",
        type: "class",
        durationMinutes: 40,
      },
      {
        name: "Period 2",
        startTime: "08:45",
        endTime: "09:25",
        type: "class",
        durationMinutes: 40,
      },
      {
        name: "Break",
        startTime: "09:25",
        endTime: "09:45",
        type: "break",
        durationMinutes: 20,
      },
      {
        name: "Period 3",
        startTime: "09:45",
        endTime: "10:25",
        type: "class",
        durationMinutes: 40,
      },
      {
        name: "Period 4",
        startTime: "10:30",
        endTime: "11:10",
        type: "class",
        durationMinutes: 40,
      },
      {
        name: "Period 5",
        startTime: "11:15",
        endTime: "11:55",
        type: "class",
        durationMinutes: 40,
      },
    ],
    lunchAfterPeriod: null,
    periodsPerDay: 5,
    schoolStart: "08:00",
    schoolEnd: "11:55",
    isDefault: false,
    sortOrder: 5,
  },
  {
    slug: "gulf-standard",
    name: "الجدول الحكومي الخليجي",
    nameEn: "Gulf Government Standard",
    description: "٧ حصص × ٤٥ دقيقة، الأحد - الخميس",
    descriptionEn: "7 periods x 45min, Sun-Thu, Gulf public school schedule",
    lang: "ar",
    country: "GULF",
    schoolType: ["public", "national"],
    schoolLevel: ["primary", "secondary", "both"],
    workingDays: [0, 1, 2, 3, 4], // Sun-Thu
    periods: [
      {
        name: "Period 1",
        startTime: "07:00",
        endTime: "07:45",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Period 2",
        startTime: "07:50",
        endTime: "08:35",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Period 3",
        startTime: "08:40",
        endTime: "09:25",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Break",
        startTime: "09:25",
        endTime: "09:45",
        type: "break",
        durationMinutes: 20,
      },
      {
        name: "Period 4",
        startTime: "09:45",
        endTime: "10:30",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Period 5",
        startTime: "10:35",
        endTime: "11:20",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Lunch",
        startTime: "11:20",
        endTime: "11:50",
        type: "lunch",
        durationMinutes: 30,
      },
      {
        name: "Period 6",
        startTime: "11:50",
        endTime: "12:35",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Period 7",
        startTime: "12:40",
        endTime: "13:25",
        type: "class",
        durationMinutes: 45,
      },
    ],
    lunchAfterPeriod: 5,
    periodsPerDay: 7,
    schoolStart: "07:00",
    schoolEnd: "13:25",
    isDefault: true,
    sortOrder: 6,
  },
  {
    slug: "gulf-private",
    name: "المدارس الخاصة الخليجية",
    nameEn: "Gulf Private / International",
    description: "٧ حصص × ٥٠ دقيقة، الأحد - الخميس",
    descriptionEn:
      "7 periods x 50min, Sun-Thu, Gulf private & international schedule",
    lang: "ar",
    country: "GULF",
    schoolType: ["private", "british", "international", "ib", "american"],
    schoolLevel: ["primary", "secondary", "both"],
    workingDays: [0, 1, 2, 3, 4], // Sun-Thu
    periods: [
      {
        name: "Period 1",
        startTime: "07:30",
        endTime: "08:20",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Period 2",
        startTime: "08:25",
        endTime: "09:15",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Period 3",
        startTime: "09:20",
        endTime: "10:10",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Break",
        startTime: "10:10",
        endTime: "10:30",
        type: "break",
        durationMinutes: 20,
      },
      {
        name: "Period 4",
        startTime: "10:30",
        endTime: "11:20",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Period 5",
        startTime: "11:25",
        endTime: "12:15",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Lunch",
        startTime: "12:15",
        endTime: "12:55",
        type: "lunch",
        durationMinutes: 40,
      },
      {
        name: "Period 6",
        startTime: "12:55",
        endTime: "13:45",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Period 7",
        startTime: "13:50",
        endTime: "14:40",
        type: "class",
        durationMinutes: 50,
      },
    ],
    lunchAfterPeriod: 5,
    periodsPerDay: 7,
    schoolStart: "07:30",
    schoolEnd: "14:40",
    isDefault: false,
    sortOrder: 7,
  },
  {
    slug: "mena-standard",
    name: "جدول الشرق الأوسط",
    nameEn: "MENA Standard",
    description: "٧ حصص × ٤٥ دقيقة، الاثنين - الجمعة",
    descriptionEn:
      "7 periods x 45min, Mon-Fri, standard MENA schedule (Egypt, Jordan, etc.)",
    lang: "ar",
    country: "MENA",
    schoolType: [
      "public",
      "national",
      "private",
      "british",
      "international",
      "ib",
      "american",
    ],
    schoolLevel: ["primary", "secondary", "both"],
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
    periods: [
      {
        name: "Period 1",
        startTime: "08:00",
        endTime: "08:45",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Period 2",
        startTime: "08:50",
        endTime: "09:35",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Period 3",
        startTime: "09:40",
        endTime: "10:25",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Break",
        startTime: "10:25",
        endTime: "10:45",
        type: "break",
        durationMinutes: 20,
      },
      {
        name: "Period 4",
        startTime: "10:45",
        endTime: "11:30",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Period 5",
        startTime: "11:35",
        endTime: "12:20",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Lunch",
        startTime: "12:20",
        endTime: "12:50",
        type: "lunch",
        durationMinutes: 30,
      },
      {
        name: "Period 6",
        startTime: "12:50",
        endTime: "13:35",
        type: "class",
        durationMinutes: 45,
      },
      {
        name: "Period 7",
        startTime: "13:40",
        endTime: "14:25",
        type: "class",
        durationMinutes: 45,
      },
    ],
    lunchAfterPeriod: 5,
    periodsPerDay: 7,
    schoolStart: "08:00",
    schoolEnd: "14:25",
    isDefault: true,
    sortOrder: 8,
  },
  {
    slug: "us-standard",
    name: "US Standard",
    nameEn: "US Standard",
    description: "7 periods x 50min, Mon-Fri",
    descriptionEn: "7 periods x 50min, Mon-Fri, standard US K-12 schedule",
    lang: "en",
    country: "US",
    schoolType: ["public", "private", "charter"],
    schoolLevel: ["primary", "secondary", "both"],
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
    periods: [
      {
        name: "Period 1",
        startTime: "08:00",
        endTime: "08:50",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Period 2",
        startTime: "08:55",
        endTime: "09:45",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Period 3",
        startTime: "09:50",
        endTime: "10:40",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Break",
        startTime: "10:40",
        endTime: "10:55",
        type: "break",
        durationMinutes: 15,
      },
      {
        name: "Period 4",
        startTime: "10:55",
        endTime: "11:45",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Lunch",
        startTime: "11:45",
        endTime: "12:25",
        type: "lunch",
        durationMinutes: 40,
      },
      {
        name: "Period 5",
        startTime: "12:25",
        endTime: "13:15",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Period 6",
        startTime: "13:20",
        endTime: "14:10",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Period 7",
        startTime: "14:15",
        endTime: "15:05",
        type: "class",
        durationMinutes: 50,
      },
    ],
    lunchAfterPeriod: 4,
    periodsPerDay: 7,
    schoolStart: "08:00",
    schoolEnd: "15:05",
    isDefault: true,
    sortOrder: 9,
  },
  {
    slug: "intl-default",
    name: "International Default",
    nameEn: "International Default",
    description: "6 periods x 50min, Mon-Fri",
    descriptionEn: "6 periods x 50min, Mon-Fri, generic international schedule",
    lang: "en",
    country: "*",
    schoolType: [],
    schoolLevel: ["primary", "secondary", "both"],
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
    periods: [
      {
        name: "Period 1",
        startTime: "08:00",
        endTime: "08:50",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Period 2",
        startTime: "08:55",
        endTime: "09:45",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Break",
        startTime: "09:45",
        endTime: "10:05",
        type: "break",
        durationMinutes: 20,
      },
      {
        name: "Period 3",
        startTime: "10:05",
        endTime: "10:55",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Period 4",
        startTime: "11:00",
        endTime: "11:50",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Lunch",
        startTime: "11:50",
        endTime: "12:30",
        type: "lunch",
        durationMinutes: 40,
      },
      {
        name: "Period 5",
        startTime: "12:30",
        endTime: "13:20",
        type: "class",
        durationMinutes: 50,
      },
      {
        name: "Period 6",
        startTime: "13:25",
        endTime: "14:15",
        type: "class",
        durationMinutes: 50,
      },
    ],
    lunchAfterPeriod: 4,
    periodsPerDay: 6,
    schoolStart: "08:00",
    schoolEnd: "14:15",
    isDefault: false,
    sortOrder: 99,
  },
]

// ---------------------------------------------------------------------------
// Mapping tables for smart recommendations
// ---------------------------------------------------------------------------

/** Map onboarding schoolType vocabulary → timetable schoolType vocabulary */
const SCHOOL_TYPE_TIMETABLE_MAP: Record<string, string[]> = {
  public: ["public", "national"],
  private: ["private"],
  international: ["british", "international", "ib", "american"],
  technical: ["public", "national", "private"],
  special: ["public", "private"],
}

/** Map ISO country code → region for schedule similarity */
const COUNTRY_REGION: Record<string, string> = {
  SA: "GULF",
  AE: "GULF",
  QA: "GULF",
  KW: "GULF",
  BH: "GULF",
  OM: "GULF",
  EG: "MENA",
  JO: "MENA",
  LB: "MENA",
  TN: "MENA",
  MA: "MENA",
  DZ: "MENA",
}

/** Structure → region mapping (structures that aren't country-specific) */
const STRUCTURE_REGION: Record<string, string> = {
  "gulf-standard": "GULF",
  "gulf-private": "GULF",
  "mena-standard": "MENA",
}

/** Legacy template name → structure slug mapping */
export const LEGACY_TEMPLATE_MAP: Record<string, string> = {
  standard_8: "sd-gov-default",
  standard_6: "sd-british",
  half_day: "sd-half-day",
}

export interface ScheduleRecommendation {
  recommended: TimetableStructure[]
  others: TimetableStructure[]
  autoSelect: TimetableStructure | null
}

/**
 * Get recommended timetable structures based on school profile using a scoring system.
 *
 * Scoring:
 * - Country exact match: +40 (SD school → SD structures)
 * - Region match: +25 (SA school → GULF structures)
 * - Wildcard (*): +5 (fallback)
 * - SchoolType match (via mapping): +20
 * - SchoolLevel match: +10
 *
 * Recommended threshold: score >= 30
 * Auto-select threshold: single best match with score >= 50
 */
export function getRecommendedStructures(
  country: string | null,
  schoolType?: string | null,
  schoolLevel?: string | null
): ScheduleRecommendation {
  const schoolRegion = country ? COUNTRY_REGION[country] : undefined
  const mappedTypes = schoolType
    ? (SCHOOL_TYPE_TIMETABLE_MAP[schoolType] ?? [schoolType])
    : []

  const scored = TIMETABLE_STRUCTURES.map((s) => {
    let score = 0

    // Country / region / wildcard scoring
    if (country && s.country === country) {
      score += 40
    } else if (
      schoolRegion &&
      (s.country === schoolRegion || STRUCTURE_REGION[s.slug] === schoolRegion)
    ) {
      score += 25
    } else if (s.country === "*") {
      score += 5
    }

    // SchoolType scoring
    if (
      mappedTypes.length > 0 &&
      s.schoolType.length > 0 &&
      mappedTypes.some((t) => s.schoolType.includes(t))
    ) {
      score += 20
    }

    // SchoolLevel scoring
    if (schoolLevel && s.schoolLevel.includes(schoolLevel)) {
      score += 10
    }

    return { structure: s, score }
  })

  // Sort by score desc, then sortOrder asc
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.structure.sortOrder - b.structure.sortOrder
  })

  const RECOMMEND_THRESHOLD = 30
  const AUTO_SELECT_THRESHOLD = 50

  const recommended = scored
    .filter((s) => s.score >= RECOMMEND_THRESHOLD)
    .map((s) => s.structure)

  const others = scored
    .filter((s) => s.score < RECOMMEND_THRESHOLD && s.score > 0)
    .map((s) => s.structure)

  // Auto-select when there's a clear best match
  const top = scored[0]
  const autoSelect =
    top && top.score >= AUTO_SELECT_THRESHOLD ? top.structure : null

  return { recommended, others, autoSelect }
}

/** Look up a single structure by slug */
export function getStructureBySlug(
  slug: string
): TimetableStructure | undefined {
  return TIMETABLE_STRUCTURES.find((s) => s.slug === slug)
}

/** Get all structures grouped by country */
export function getStructuresByCountry(): Record<string, TimetableStructure[]> {
  const grouped: Record<string, TimetableStructure[]> = {}
  for (const s of TIMETABLE_STRUCTURES) {
    if (!grouped[s.country]) grouped[s.country] = []
    grouped[s.country].push(s)
  }
  return grouped
}

/** Day names for display */
const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** Format working days for display, e.g. "Sun - Thu" */
export function formatWorkingDays(days: number[]): string {
  if (days.length === 0) return ""
  const sorted = [...days].sort((a, b) => a - b)
  const isContiguous = sorted.every(
    (d, i) => i === 0 || d === sorted[i - 1] + 1
  )
  if (isContiguous && sorted.length > 1) {
    return `${DAY_NAMES_SHORT[sorted[0]]} - ${DAY_NAMES_SHORT[sorted[sorted.length - 1]]}`
  }
  return sorted.map((d) => DAY_NAMES_SHORT[d]).join(", ")
}

// ---------------------------------------------------------------------------
// Schedule config types & helpers (Apple Configurator flow)
// ---------------------------------------------------------------------------

export interface ScheduleConfig {
  weekendType: "fri-sat" | "sat-sun"
  periodsPerDay: number
  durationMinutes: number
  startTime: string
}

export const WEEKEND_OPTIONS = [
  {
    value: "fri-sat" as const,
    label: "Fri - Sat",
    workingDays: [0, 1, 2, 3, 4],
  },
  {
    value: "sat-sun" as const,
    label: "Sat - Sun",
    workingDays: [1, 2, 3, 4, 5],
  },
]
export const PERIOD_COUNT_OPTIONS = [5, 6, 7, 8]
export const DURATION_OPTIONS = [40, 45, 50, 55]
export const START_TIME_OPTIONS = ["07:00", "07:30", "08:00", "08:30"]

/** Extract a ScheduleConfig from a predefined structure */
export function extractConfig(s: TimetableStructure): ScheduleConfig {
  const isSunThu = s.workingDays.includes(0) && !s.workingDays.includes(5)
  return {
    weekendType: isSunThu ? "fri-sat" : "sat-sun",
    periodsPerDay: s.periodsPerDay,
    durationMinutes:
      s.periods.find((p) => p.type === "class")?.durationMinutes ?? 45,
    startTime: s.schoolStart,
  }
}

/** Add minutes to an "HH:mm" time string */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number)
  const total = h * 60 + m + minutes
  const hh = Math.floor(total / 60)
    .toString()
    .padStart(2, "0")
  const mm = (total % 60).toString().padStart(2, "0")
  return `${hh}:${mm}`
}

/** Generate a period array from config params (for live hero preview) */
export function generatePeriods(config: {
  periodsPerDay: number
  durationMinutes: number
  startTime: string
}): { periods: StructurePeriod[]; schoolEnd: string } {
  const { periodsPerDay, durationMinutes, startTime } = config
  const periods: StructurePeriod[] = []
  let cursor = startTime
  const GAP = 5
  const BREAK_DURATION = 20
  const LUNCH_DURATION = 30
  const breakAfter = Math.ceil(periodsPerDay / 2)
  // Lunch before last 2 class periods (or skip if <= 5 periods)
  const lunchAfter = periodsPerDay > 5 ? periodsPerDay - 2 : null

  let classIndex = 0

  for (let i = 0; i < periodsPerDay; i++) {
    classIndex++

    // Insert break after breakAfter class periods
    if (classIndex === breakAfter + 1 && classIndex <= periodsPerDay) {
      const breakEnd = addMinutes(cursor, BREAK_DURATION)
      periods.push({
        name: "Break",
        startTime: cursor,
        endTime: breakEnd,
        type: "break",
        durationMinutes: BREAK_DURATION,
      })
      cursor = breakEnd
    }

    // Insert lunch after lunchAfter class periods
    if (
      lunchAfter !== null &&
      classIndex === lunchAfter + 1 &&
      classIndex <= periodsPerDay
    ) {
      const lunchEnd = addMinutes(cursor, LUNCH_DURATION)
      periods.push({
        name: "Lunch",
        startTime: cursor,
        endTime: lunchEnd,
        type: "lunch",
        durationMinutes: LUNCH_DURATION,
      })
      cursor = lunchEnd
    }

    const end = addMinutes(cursor, durationMinutes)
    periods.push({
      name: `Period ${classIndex}`,
      startTime: cursor,
      endTime: end,
      type: "class",
      durationMinutes,
    })
    cursor = addMinutes(end, GAP)
  }

  const lastPeriod = periods[periods.length - 1]
  return { periods, schoolEnd: lastPeriod.endTime }
}

/** Score & find the best predefined structure matching a config */
export function findBestStructure(
  config: ScheduleConfig,
  candidates: TimetableStructure[]
): TimetableStructure | null {
  const targetDays =
    WEEKEND_OPTIONS.find((w) => w.value === config.weekendType)?.workingDays ??
    []

  let best: TimetableStructure | null = null
  let bestScore = -1

  for (const c of candidates) {
    let score = 0

    // Working days match
    const daysMatch =
      c.workingDays.length === targetDays.length &&
      c.workingDays.every((d) => targetDays.includes(d))
    if (daysMatch) score += 10

    // Periods per day
    if (c.periodsPerDay === config.periodsPerDay) score += 10

    // Duration closeness
    const classPeriod = c.periods.find((p) => p.type === "class")
    const dur = classPeriod?.durationMinutes ?? 0
    if (dur === config.durationMinutes) {
      score += 5
    } else if (Math.abs(dur - config.durationMinutes) <= 5) {
      score += 2
    }

    // Start time closeness
    const [sh, sm] = c.schoolStart.split(":").map(Number)
    const [th, tm] = config.startTime.split(":").map(Number)
    const diffMinutes = Math.abs(sh * 60 + sm - (th * 60 + tm))
    if (diffMinutes === 0) {
      score += 5
    } else if (diffMinutes <= 30) {
      score += 2
    }

    if (score > bestScore) {
      bestScore = score
      best = c
    }
  }

  return best
}
