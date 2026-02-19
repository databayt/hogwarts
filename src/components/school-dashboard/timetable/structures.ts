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
  nameEn: string
  description: string
  descriptionEn: string
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
]

/** Legacy template name → structure slug mapping */
export const LEGACY_TEMPLATE_MAP: Record<string, string> = {
  standard_8: "sd-gov-default",
  standard_6: "sd-british",
  half_day: "sd-half-day",
}

/**
 * Get recommended timetable structures based on school profile.
 * Returns matching structures sorted by isDefault first, then sortOrder.
 */
export function getRecommendedStructures(
  country: string,
  schoolType?: string,
  schoolLevel?: string
): TimetableStructure[] {
  return TIMETABLE_STRUCTURES.filter((s) => {
    if (s.country !== country) return false
    if (schoolType && !s.schoolType.includes(schoolType)) return false
    if (schoolLevel && !s.schoolLevel.includes(schoolLevel)) return false
    return true
  }).sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
    return a.sortOrder - b.sortOrder
  })
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
