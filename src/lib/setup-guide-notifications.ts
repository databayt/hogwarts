// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

const SETUP_GUIDE_EXPIRATION_DAYS = 90

interface SetupStep {
  stepNumber: number
  titleAr: string
  titleEn: string
  bodyAr: string
  bodyEn: string
  url: string
}

const SETUP_STEPS: SetupStep[] = [
  {
    stepNumber: 0,
    titleAr: "مرحبًا بك في مدرستك!",
    titleEn: "Welcome to your school!",
    bodyAr:
      "تم إعداد مدرستك بنجاح. اتبع الخطوات التالية لتفعيل النظام بالكامل.",
    bodyEn:
      "Your school has been set up successfully. Follow the next steps to fully activate the system.",
    url: "/dashboard",
  },
  // Onboarding already built the grades, their subjects, the sections and a
  // weekly timetable for every section — subjects are placed and waiting for
  // teachers. What's left is people: hire, give each teacher their subjects,
  // place students. ("Generate classes" / "enroll into classes" steps are gone:
  // classes are being retired in favour of section + subject.)
  {
    stepNumber: 1,
    titleAr: "الخطوة 1: إضافة المعلمين",
    titleEn: "Step 1: Add Teachers",
    bodyAr: "أضف المعلمين يدويًا أو عبر ملف CSV من صفحة المعلمين.",
    bodyEn: "Add teachers manually or via CSV from the Teachers page.",
    url: "/teachers",
  },
  {
    stepNumber: 2,
    titleAr: "الخطوة 2: تحديد مواد كل معلم",
    titleEn: "Step 2: Choose Each Teacher's Subjects",
    bodyAr: "حدد المواد التي يدرّسها كل معلم، فتُسند إليه حصصها في الجدول.",
    bodyEn:
      "Choose the subjects each teacher teaches so their periods in the timetable get a teacher.",
    url: "/teachers",
  },
  {
    stepNumber: 3,
    titleAr: "الخطوة 3: إضافة الطلاب",
    titleEn: "Step 3: Add Students",
    bodyAr: "أضف الطلاب يدويًا أو عبر ملف CSV من صفحة الطلاب.",
    bodyEn: "Add students manually or via CSV from the Students page.",
    url: "/students",
  },
  {
    stepNumber: 4,
    titleAr: "الخطوة 4: توزيع الطلاب على الفصول",
    titleEn: "Step 4: Place Students in Sections",
    bodyAr: "ضع كل طالب في فصله ليظهر له جدوله وحضوره.",
    bodyEn:
      "Place each student in their section so they get its timetable and attendance.",
    url: "/students",
  },
  {
    stepNumber: 5,
    titleAr: "الخطوة 5: مراجعة الجدول المدرسي",
    titleEn: "Step 5: Review the Timetable",
    bodyAr:
      "جدول كل فصل جاهز. الحصص التي لم يُسند لها معلم تظهر «بانتظار معلم».",
    bodyEn:
      "Every section already has its weekly timetable. Periods without a teacher show “Needs teacher”.",
    url: "/timetable",
  },
]

export async function dispatchSetupGuideNotifications(
  schoolId: string,
  userId: string,
  preferredLanguage: string = "ar"
): Promise<{ created: number }> {
  try {
    const isArabic = preferredLanguage === "ar"
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + SETUP_GUIDE_EXPIRATION_DAYS)

    const result = await db.notification.createMany({
      data: SETUP_STEPS.map((step) => ({
        schoolId,
        userId,
        type: "setup_guide" as const,
        title: isArabic ? step.titleAr : step.titleEn,
        body: isArabic ? step.bodyAr : step.bodyEn,
        lang: preferredLanguage,
        priority:
          step.stepNumber === 0 ? ("high" as const) : ("normal" as const),
        channels: ["in_app"] as const,
        metadata: {
          url: `/${preferredLanguage}${step.url}`,
          stepNumber: step.stepNumber,
          setupGuide: true,
        } as unknown as Prisma.InputJsonValue,
        expiresAt,
      })),
    })

    console.log(
      `[dispatchSetupGuideNotifications] Created ${result.count} setup guide notifications for school ${schoolId}`
    )

    return { created: result.count }
  } catch (error) {
    console.error("[dispatchSetupGuideNotifications] Error:", error)
    return { created: 0 }
  }
}
