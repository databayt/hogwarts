/**
 * Events Seed
 * Creates 30+ MENA school year events spanning Sep 2025 - Jun 2026
 *
 * Phase 9: Announcements & Events
 *
 * Features:
 * - Islamic holidays (Mawlid, Isra, Ramadan, Eid Al-Fitr, Eid Al-Adha)
 * - Academic milestones (term start/end, exams, graduation)
 * - National days (Independence Day, Teacher's Day)
 * - Activities (Science Week, Reading Week, Quran Competition, Arabic Day)
 */

import type { PrismaClient } from "@prisma/client"

import { logSuccess } from "./utils"

// ============================================================================
// EVENT TYPE (matches Prisma enum)
// ============================================================================

type EventType =
  | "ACADEMIC"
  | "SPORTS"
  | "CULTURAL"
  | "PARENT_MEETING"
  | "CELEBRATION"
  | "WORKSHOP"
  | "OTHER"

interface MENAEvent {
  title: string
  description: string
  type: EventType
  startDate: Date
  endDate: Date
}

// ============================================================================
// FULL MENA SCHOOL YEAR CALENDAR (Sep 2025 - Jun 2026)
// ============================================================================

const MENA_EVENTS: MENAEvent[] = [
  // === SEPTEMBER 2025 ===
  {
    title: "اليوم الأول للمدرسة",
    description: "حفل ترحيب لجميع الطلاب وأولياء الأمور",
    type: "ACADEMIC",
    startDate: new Date("2025-09-01T08:00:00"),
    endDate: new Date("2025-09-01T12:00:00"),
  },
  {
    title: "أسبوع التهيئة",
    description: "أسبوع تعريفي للطلاب الجدد بالمدرسة ونظامها",
    type: "ACADEMIC",
    startDate: new Date("2025-09-01T08:00:00"),
    endDate: new Date("2025-09-04T14:00:00"),
  },
  {
    title: "المولد النبوي الشريف",
    description: "احتفال بذكرى مولد النبي محمد صلى الله عليه وسلم",
    type: "CELEBRATION",
    startDate: new Date("2025-09-05T08:00:00"),
    endDate: new Date("2025-09-05T12:00:00"),
  },

  // === OCTOBER 2025 ===
  {
    title: "اجتماع أولياء الأمور الأول",
    description: "لقاء أولياء الأمور مع المعلمين للتعرف على الخطة الدراسية",
    type: "PARENT_MEETING",
    startDate: new Date("2025-10-02T16:00:00"),
    endDate: new Date("2025-10-02T18:00:00"),
  },
  {
    title: "معرض الفنون",
    description: "معرض فنون الطلاب - رسم وأشغال يدوية",
    type: "CULTURAL",
    startDate: new Date("2025-10-10T09:00:00"),
    endDate: new Date("2025-10-10T15:00:00"),
  },
  {
    title: "يوم المعلم",
    description: "احتفال بيوم المعلم وتكريم المعلمين المتميزين",
    type: "CELEBRATION",
    startDate: new Date("2025-10-16T08:00:00"),
    endDate: new Date("2025-10-16T12:00:00"),
  },
  {
    title: "امتحانات منتصف الفصل الأول",
    description: "امتحانات منتصف الفصل الدراسي الأول",
    type: "ACADEMIC",
    startDate: new Date("2025-10-20T08:00:00"),
    endDate: new Date("2025-10-30T14:00:00"),
  },
  {
    title: "بطولة كرة القدم",
    description: "بطولة كرة القدم بين الفصول الدراسية",
    type: "SPORTS",
    startDate: new Date("2025-10-25T14:00:00"),
    endDate: new Date("2025-10-30T16:00:00"),
  },

  // === NOVEMBER 2025 ===
  {
    title: "ورشة عمل أولياء الأمور",
    description: "ورشة عمل حول دعم تعلم الطلاب في المنزل",
    type: "PARENT_MEETING",
    startDate: new Date("2025-11-05T16:00:00"),
    endDate: new Date("2025-11-05T18:00:00"),
  },
  {
    title: "أسبوع العلوم",
    description: "أسبوع العلوم السنوي مع تجارب ومعارض علمية",
    type: "ACADEMIC",
    startDate: new Date("2025-11-09T08:00:00"),
    endDate: new Date("2025-11-13T14:00:00"),
  },
  {
    title: "معرض العلوم",
    description: "معرض العلوم السنوي لعرض مشاريع الطلاب",
    type: "ACADEMIC",
    startDate: new Date("2025-11-15T09:00:00"),
    endDate: new Date("2025-11-15T15:00:00"),
  },
  {
    title: "مسابقة السباحة",
    description: "بطولة السباحة بين الفصول",
    type: "SPORTS",
    startDate: new Date("2025-11-20T10:00:00"),
    endDate: new Date("2025-11-20T14:00:00"),
  },
  {
    title: "مسابقة القرآن الكريم",
    description: "مسابقة تلاوة وحفظ القرآن الكريم السنوية",
    type: "OTHER",
    startDate: new Date("2025-11-25T08:00:00"),
    endDate: new Date("2025-11-25T12:00:00"),
  },

  // === DECEMBER 2025 ===
  {
    title: "اليوم الثقافي",
    description: "احتفال بالثقافة والتراث السوداني",
    type: "CULTURAL",
    startDate: new Date("2025-12-01T08:00:00"),
    endDate: new Date("2025-12-01T14:00:00"),
  },
  {
    title: "امتحانات نهاية الفصل الأول",
    description: "الامتحانات النهائية للفصل الدراسي الأول",
    type: "ACADEMIC",
    startDate: new Date("2025-12-07T08:00:00"),
    endDate: new Date("2025-12-18T14:00:00"),
  },
  {
    title: "يوم اللغة العربية",
    description: "احتفال باليوم العالمي للغة العربية - مسابقات وعروض",
    type: "CULTURAL",
    startDate: new Date("2025-12-18T08:00:00"),
    endDate: new Date("2025-12-18T14:00:00"),
  },
  {
    title: "بداية إجازة الشتاء",
    description: "بداية إجازة نهاية الفصل الأول",
    type: "OTHER",
    startDate: new Date("2025-12-20T12:00:00"),
    endDate: new Date("2026-01-09T08:00:00"),
  },

  // === JANUARY 2026 ===
  {
    title: "احتفال عيد الاستقلال",
    description: "احتفال عيد استقلال السودان",
    type: "CELEBRATION",
    startDate: new Date("2026-01-01T08:00:00"),
    endDate: new Date("2026-01-01T12:00:00"),
  },
  {
    title: "بداية الفصل الثاني",
    description: "استئناف الدراسة وبداية الفصل الدراسي الثاني",
    type: "ACADEMIC",
    startDate: new Date("2026-01-10T08:00:00"),
    endDate: new Date("2026-01-10T14:00:00"),
  },
  {
    title: "توزيع شهادات الفصل الأول",
    description: "توزيع شهادات وتقارير الفصل الدراسي الأول",
    type: "ACADEMIC",
    startDate: new Date("2026-01-15T09:00:00"),
    endDate: new Date("2026-01-15T12:00:00"),
  },
  {
    title: "الإسراء والمعراج",
    description: "ذكرى الإسراء والمعراج",
    type: "OTHER",
    startDate: new Date("2026-01-26T08:00:00"),
    endDate: new Date("2026-01-26T12:00:00"),
  },

  // === FEBRUARY 2026 ===
  {
    title: "أسبوع القراءة",
    description: "أسبوع تشجيع القراءة مع مسابقات وأنشطة",
    type: "CULTURAL",
    startDate: new Date("2026-02-08T08:00:00"),
    endDate: new Date("2026-02-12T14:00:00"),
  },
  {
    title: "بداية رمضان",
    description: "بداية شهر رمضان المبارك - تعديل الجدول الدراسي",
    type: "OTHER",
    startDate: new Date("2026-02-18T08:00:00"),
    endDate: new Date("2026-02-18T12:00:00"),
  },

  // === MARCH 2026 ===
  {
    title: "اجتماع أولياء الأمور الثاني",
    description: "لقاء أولياء الأمور مع المعلمين لمتابعة تقدم الطلاب",
    type: "PARENT_MEETING",
    startDate: new Date("2026-03-05T16:00:00"),
    endDate: new Date("2026-03-05T18:00:00"),
  },
  {
    title: "يوم الرياضة",
    description: "المسابقة الرياضية السنوية - ألعاب قوى وسباقات",
    type: "SPORTS",
    startDate: new Date("2026-03-15T08:00:00"),
    endDate: new Date("2026-03-15T16:00:00"),
  },
  {
    title: "عطلة عيد الفطر",
    description: "عطلة عيد الفطر المبارك",
    type: "CELEBRATION",
    startDate: new Date("2026-03-20T00:00:00"),
    endDate: new Date("2026-03-27T23:59:59"),
  },

  // === APRIL 2026 ===
  {
    title: "امتحانات منتصف الفصل الثاني",
    description: "امتحانات منتصف الفصل الدراسي الثاني",
    type: "ACADEMIC",
    startDate: new Date("2026-04-05T08:00:00"),
    endDate: new Date("2026-04-16T14:00:00"),
  },
  {
    title: "الرحلة المدرسية",
    description: "الرحلة المدرسية السنوية",
    type: "OTHER",
    startDate: new Date("2026-04-23T07:00:00"),
    endDate: new Date("2026-04-23T17:00:00"),
  },

  // === MAY 2026 ===
  {
    title: "عيد الأضحى",
    description: "عطلة عيد الأضحى المبارك",
    type: "CELEBRATION",
    startDate: new Date("2026-05-27T00:00:00"),
    endDate: new Date("2026-06-02T23:59:59"),
  },

  // === JUNE 2026 ===
  {
    title: "امتحانات نهاية الفصل الثاني",
    description: "الامتحانات النهائية للفصل الدراسي الثاني",
    type: "ACADEMIC",
    startDate: new Date("2026-06-07T08:00:00"),
    endDate: new Date("2026-06-18T14:00:00"),
  },
  {
    title: "حفل نهاية العام",
    description: "حفل نهاية العام الدراسي وتكريم المتفوقين",
    type: "CELEBRATION",
    startDate: new Date("2026-06-22T09:00:00"),
    endDate: new Date("2026-06-22T13:00:00"),
  },
  {
    title: "حفل التخرج",
    description: "حفل التخرج السنوي لطلاب الصف الثاني عشر",
    type: "ACADEMIC",
    startDate: new Date("2026-06-25T09:00:00"),
    endDate: new Date("2026-06-25T13:00:00"),
  },
  {
    title: "بداية إجازة الصيف",
    description: "بداية الإجازة الصيفية",
    type: "OTHER",
    startDate: new Date("2026-06-28T12:00:00"),
    endDate: new Date("2026-08-31T23:59:59"),
  },
]

// ============================================================================
// EVENTS SEEDING
// ============================================================================

export async function seedEvents(
  prisma: PrismaClient,
  schoolId: string
): Promise<number> {
  let count = 0

  for (const event of MENA_EVENTS) {
    try {
      const existing = await prisma.event.findFirst({
        where: {
          schoolId,
          title: event.title,
          eventDate: event.startDate,
        },
      })

      if (!existing) {
        await prisma.event.create({
          data: {
            schoolId,
            title: event.title,
            description: event.description,
            eventType: event.type,
            eventDate: event.startDate,
            startTime: event.startDate.toTimeString().slice(0, 5),
            endTime: event.endDate.toTimeString().slice(0, 5),
            status: "PLANNED",
          },
        })
        count++
      }
    } catch {
      // Skip duplicates
    }
  }

  logSuccess("Events", count, "MENA calendar Sep 2025 - Jun 2026")

  return count
}
