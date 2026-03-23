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
  {
    stepNumber: 1,
    titleAr: "الخطوة 1: إضافة المعلمين",
    titleEn: "Step 1: Import Teachers",
    bodyAr: "أضف المعلمين يدويًا أو عبر ملف CSV من صفحة المعلمين.",
    bodyEn: "Add teachers manually or via CSV from the Teachers page.",
    url: "/teachers",
  },
  {
    stepNumber: 2,
    titleAr: "الخطوة 2: إضافة الطلاب",
    titleEn: "Step 2: Import Students",
    bodyAr: "أضف الطلاب يدويًا أو عبر ملف CSV من صفحة الطلاب.",
    bodyEn: "Add students manually or via CSV from the Students page.",
    url: "/students",
  },
  {
    stepNumber: 3,
    titleAr: "الخطوة 3: تعيين المراحل للطلاب",
    titleEn: "Step 3: Assign Grades to Students",
    bodyAr: "حدد المرحلة الدراسية لكل طالب حتى يتم تسجيلهم في الفصول.",
    bodyEn:
      "Assign an academic grade to each student so they can be enrolled in classes.",
    url: "/students",
  },
  {
    stepNumber: 4,
    titleAr: "الخطوة 4: إنشاء الفصول",
    titleEn: "Step 4: Generate Classes",
    bodyAr: "انتقل إلى الفصول الدراسية > إعداد لإنشاء فصول المواد تلقائيًا.",
    bodyEn:
      "Go to Classrooms > Configure to auto-generate subject classes for each grade.",
    url: "/classrooms/configure",
  },
  {
    stepNumber: 5,
    titleAr: "الخطوة 5: تسجيل الطلاب في الفصول",
    titleEn: "Step 5: Enroll Students",
    bodyAr:
      "انتقل إلى الفصول الدراسية > إعداد لتسجيل الطلاب في فصولهم تلقائيًا.",
    bodyEn:
      "Go to Classrooms > Configure to enroll students into their grade's classes.",
    url: "/classrooms/configure",
  },
  {
    stepNumber: 6,
    titleAr: "الخطوة 6: تحديد تخصصات المعلمين",
    titleEn: "Step 6: Set Teacher Expertise",
    bodyAr: "حدد المواد التي يدرسها كل معلم حتى يتمكن نظام الجدول من توزيعهم.",
    bodyEn:
      "Set subject qualifications for each teacher so the timetable algorithm can assign them.",
    url: "/teachers",
  },
  {
    stepNumber: 7,
    titleAr: "الخطوة 7: إنشاء الجدول المدرسي",
    titleEn: "Step 7: Generate Timetable",
    bodyAr: "انتقل إلى الجدول المدرسي > إنشاء لإنشاء الجدول الأسبوعي تلقائيًا.",
    bodyEn:
      "Go to Timetable > Generate to auto-generate the weekly school timetable.",
    url: "/timetable/generate",
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
