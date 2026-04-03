// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * King Fahad Schools — Content Seed
 *
 * Seeds announcements, events, and config for the King Fahad tenant.
 * Content centered around April 2026 to feel like a live, active school.
 * Idempotent — safe to run multiple times.
 *
 * Usage:
 *   tsx prisma/seeds/seed-kingfahad-content.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ============================================================================
// ANNOUNCEMENTS — Mix of past, current, and upcoming
// ============================================================================

interface AnnouncementSeed {
  title: string
  body: string
  scope: "school" | "class" | "role"
  priority: "low" | "normal" | "high" | "urgent"
  publishedAt: Date
  expiresAt?: Date
  pinned?: boolean
  featured?: boolean
}

const ANNOUNCEMENTS: AnnouncementSeed[] = [
  // === PINNED / FEATURED ===
  {
    title: "باب القبول مفتوح للعام الدراسي 2026-2027",
    body: "يسر مدارس الملك فهد الإعلان عن فتح باب القبول والتسجيل للعام الدراسي الجديد 2026-2027 لجميع المراحل من الروضة حتى الثاني عشر. قدّم طلبك الآن عبر البوابة الإلكترونية. آخر موعد للتسجيل: 30 سبتمبر 2026.",
    scope: "school",
    priority: "high",
    publishedAt: new Date("2026-04-01T08:00:00"),
    pinned: true,
    featured: true,
  },
  {
    title: "مرحباً بكم في الفصل الدراسي الثاني",
    body: "نتمنى لجميع طلابنا وطالباتنا ومعلمينا فصلاً دراسياً مليئاً بالنجاح والتميز. نذكّركم بأهمية الالتزام بالحضور والمواظبة.",
    scope: "school",
    priority: "normal",
    publishedAt: new Date("2026-01-10T08:00:00"),
    pinned: true,
  },

  // === JANUARY 2026 — Term 2 start ===
  {
    title: "توزيع نتائج الفصل الأول",
    body: "تم اعتماد نتائج الفصل الدراسي الأول. يمكن لأولياء الأمور الاطلاع على النتائج عبر البوابة الإلكترونية أو استلام كشف الدرجات من الإدارة.",
    scope: "school",
    priority: "high",
    publishedAt: new Date("2026-01-15T08:00:00"),
    expiresAt: new Date("2026-02-01T08:00:00"),
  },
  {
    title: "جدول الحصص المعدّل — الفصل الثاني",
    body: "تم تعديل جدول الحصص للفصل الدراسي الثاني. يرجى مراجعة الجدول الجديد عبر البوابة أو لوحة الإعلانات.",
    scope: "school",
    priority: "normal",
    publishedAt: new Date("2026-01-12T08:00:00"),
    expiresAt: new Date("2026-02-01T08:00:00"),
  },

  // === FEBRUARY 2026 — Ramadan prep ===
  {
    title: "إعلان بدء شهر رمضان المبارك",
    body: "بمناسبة حلول شهر رمضان المبارك، سيتم تعديل الدوام المدرسي ليكون من 8:00 صباحاً حتى 1:00 ظهراً. نسأل الله أن يتقبل صيامكم وقيامكم.",
    scope: "school",
    priority: "high",
    publishedAt: new Date("2026-02-17T08:00:00"),
    expiresAt: new Date("2026-03-20T08:00:00"),
  },
  {
    title: "مسابقة القرآن الكريم الرمضانية",
    body: "تعلن المدرسة عن مسابقة القرآن الكريم خلال شهر رمضان. الفئات: حفظ جزء عم، 5 أجزاء، 10 أجزاء. التسجيل مفتوح حتى 25 فبراير. جوائز قيّمة للفائزين.",
    scope: "school",
    priority: "normal",
    publishedAt: new Date("2026-02-20T08:00:00"),
    expiresAt: new Date("2026-03-15T08:00:00"),
  },

  // === MARCH 2026 — Eid & return ===
  {
    title: "عطلة عيد الفطر المبارك",
    body: "تبدأ عطلة عيد الفطر المبارك من يوم الجمعة 20 مارس وحتى الخميس 27 مارس. تستأنف الدراسة يوم الأحد 29 مارس. كل عام وأنتم بخير!",
    scope: "school",
    priority: "urgent",
    publishedAt: new Date("2026-03-18T08:00:00"),
    expiresAt: new Date("2026-03-29T08:00:00"),
  },
  {
    title: "استئناف الدراسة بعد عيد الفطر",
    body: "نرحب بعودة جميع الطلاب والمعلمين بعد إجازة عيد الفطر المبارك. نذكّر بأن الدوام يعود لموعده الطبيعي من 7:30 صباحاً حتى 2:30 ظهراً.",
    scope: "school",
    priority: "high",
    publishedAt: new Date("2026-03-29T07:00:00"),
    expiresAt: new Date("2026-04-05T08:00:00"),
  },
  {
    title: "نتائج مسابقة القرآن الكريم",
    body: "تهانينا لجميع المشاركين في مسابقة القرآن الكريم الرمضانية! المركز الأول: محمد أحمد عثمان (حفظ 10 أجزاء)، المركز الثاني: فاطمة حسن محمد، المركز الثالث: عبدالرحمن إبراهيم.",
    scope: "school",
    priority: "normal",
    publishedAt: new Date("2026-03-30T08:00:00"),
  },

  // === APRIL 2026 — Current month (demo time!) ===
  {
    title: "جدول امتحانات منتصف الفصل الثاني",
    body: "تبدأ امتحانات منتصف الفصل الدراسي الثاني يوم الأحد 5 أبريل وتنتهي الخميس 16 أبريل. الجدول التفصيلي متوفر عبر البوابة. ندعو الطلاب للاستعداد المبكر.",
    scope: "school",
    priority: "high",
    publishedAt: new Date("2026-04-01T08:00:00"),
    expiresAt: new Date("2026-04-17T08:00:00"),
    featured: true,
  },
  {
    title: "إرشادات الامتحانات — تذكير",
    body: "نذكّر جميع الطلاب بقواعد الامتحانات: الحضور قبل 15 دقيقة، إحضار الأدوات المطلوبة، الالتزام بالهدوء التام، يمنع استخدام الهاتف المحمول. أي مخالفة ستؤدي إلى إلغاء الامتحان.",
    scope: "school",
    priority: "urgent",
    publishedAt: new Date("2026-04-03T08:00:00"),
    expiresAt: new Date("2026-04-17T08:00:00"),
  },
  {
    title: "اجتماع أولياء الأمور — أبريل",
    body: "يسرنا دعوة جميع أولياء الأمور لحضور اجتماع مناقشة تقدم الطلاب ونتائج منتصف الفصل، وذلك يوم الخميس 24 أبريل من الساعة 4:00 حتى 6:00 مساءً في قاعة المدرسة.",
    scope: "school",
    priority: "high",
    publishedAt: new Date("2026-04-02T08:00:00"),
    expiresAt: new Date("2026-04-25T08:00:00"),
  },
  {
    title: "التسجيل في النادي الصيفي",
    body: "يفتح باب التسجيل في النادي الصيفي لعام 2026. الأنشطة تشمل: السباحة، كرة القدم، الكاراتيه، الرسم، البرمجة، وتعلم اللغة الإنجليزية. التسجيل المبكر حتى 30 أبريل بخصم 20%.",
    scope: "school",
    priority: "normal",
    publishedAt: new Date("2026-04-01T10:00:00"),
    expiresAt: new Date("2026-05-15T08:00:00"),
  },

  // === ROLE-SCOPED ===
  {
    title: "تحديث بيانات أولياء الأمور",
    body: "يرجى من جميع أولياء الأمور التأكد من تحديث أرقام الهاتف والبريد الإلكتروني عبر البوابة، لضمان وصول الإشعارات والتحديثات.",
    scope: "role",
    priority: "normal",
    publishedAt: new Date("2026-04-01T09:00:00"),
    expiresAt: new Date("2026-04-30T08:00:00"),
  },
  {
    title: "ورشة تطوير مهني للمعلمين",
    body: "ستعقد ورشة عمل بعنوان 'استراتيجيات التعليم الحديثة' يوم السبت 19 أبريل. الحضور إلزامي لجميع المعلمين. المحاضر: د. أحمد عبدالله.",
    scope: "role",
    priority: "high",
    publishedAt: new Date("2026-04-02T08:00:00"),
    expiresAt: new Date("2026-04-20T08:00:00"),
  },
]

// ============================================================================
// EVENTS — School year calendar centered on current period
// ============================================================================

interface EventSeed {
  title: string
  description: string
  eventType:
    | "ACADEMIC"
    | "SPORTS"
    | "CULTURAL"
    | "PARENT_MEETING"
    | "CELEBRATION"
    | "WORKSHOP"
    | "OTHER"
  eventDate: Date
  startTime: string
  endTime: string
  location?: string
  status: "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED" | "POSTPONED"
  isPublic?: boolean
  targetAudience?: string
}

const EVENTS: EventSeed[] = [
  // === COMPLETED (past — shows the school has history) ===
  {
    title: "اليوم الأول للفصل الثاني",
    description: "استقبال الطلاب وتوزيع الجداول الدراسية الجديدة",
    eventType: "ACADEMIC",
    eventDate: new Date("2026-01-10"),
    startTime: "07:30",
    endTime: "14:30",
    location: "المبنى الرئيسي",
    status: "COMPLETED",
  },
  {
    title: "توزيع شهادات الفصل الأول",
    description: "حفل توزيع شهادات ونتائج الفصل الدراسي الأول وتكريم المتفوقين",
    eventType: "ACADEMIC",
    eventDate: new Date("2026-01-15"),
    startTime: "09:00",
    endTime: "12:00",
    location: "قاعة المدرسة",
    status: "COMPLETED",
    isPublic: true,
  },
  {
    title: "أسبوع القراءة",
    description: "أسبوع تشجيع القراءة مع مسابقات أدبية وعروض كتب",
    eventType: "CULTURAL",
    eventDate: new Date("2026-02-08"),
    startTime: "08:00",
    endTime: "14:00",
    location: "المكتبة",
    status: "COMPLETED",
  },
  {
    title: "بداية شهر رمضان — تعديل الدوام",
    description: "بداية شهر رمضان المبارك. الدوام المعدّل: 8:00 ص — 1:00 م",
    eventType: "OTHER",
    eventDate: new Date("2026-02-18"),
    startTime: "08:00",
    endTime: "13:00",
    status: "COMPLETED",
  },
  {
    title: "مسابقة القرآن الكريم الرمضانية",
    description:
      "مسابقة سنوية في حفظ وتلاوة القرآن الكريم. فئات: جزء عم، 5 أجزاء، 10 أجزاء",
    eventType: "CULTURAL",
    eventDate: new Date("2026-03-10"),
    startTime: "09:00",
    endTime: "12:00",
    location: "مصلى المدرسة",
    status: "COMPLETED",
    isPublic: true,
  },
  {
    title: "يوم الرياضة",
    description: "المسابقة الرياضية السنوية — ألعاب قوى، كرة قدم، سباقات",
    eventType: "SPORTS",
    eventDate: new Date("2026-03-15"),
    startTime: "08:00",
    endTime: "16:00",
    location: "الملعب الرئيسي",
    status: "COMPLETED",
    isPublic: true,
    targetAudience: "جميع الطلاب",
  },
  {
    title: "عطلة عيد الفطر المبارك",
    description: "عطلة عيد الفطر المبارك — كل عام وأنتم بخير",
    eventType: "CELEBRATION",
    eventDate: new Date("2026-03-20"),
    startTime: "00:00",
    endTime: "23:59",
    status: "COMPLETED",
  },

  // === ONGOING / UPCOMING (April 2026 — demo period) ===
  {
    title: "امتحانات منتصف الفصل الثاني",
    description: "امتحانات منتصف الفصل الدراسي الثاني لجميع المراحل",
    eventType: "ACADEMIC",
    eventDate: new Date("2026-04-05"),
    startTime: "08:00",
    endTime: "14:00",
    location: "القاعات الدراسية",
    status: "PLANNED",
    targetAudience: "جميع الطلاب",
  },
  {
    title: "ورشة تطوير مهني للمعلمين",
    description: "ورشة 'استراتيجيات التعليم الحديثة' مع د. أحمد عبدالله",
    eventType: "WORKSHOP",
    eventDate: new Date("2026-04-19"),
    startTime: "09:00",
    endTime: "14:00",
    location: "قاعة الاجتماعات",
    status: "PLANNED",
    targetAudience: "المعلمون",
  },
  {
    title: "الرحلة المدرسية السنوية",
    description: "رحلة ترفيهية وتعليمية لطلاب المرحلة الابتدائية",
    eventType: "OTHER",
    eventDate: new Date("2026-04-23"),
    startTime: "07:00",
    endTime: "17:00",
    location: "حديقة المقرن",
    status: "PLANNED",
    isPublic: true,
    targetAudience: "طلاب المرحلة الابتدائية",
  },
  {
    title: "اجتماع أولياء الأمور",
    description: "مناقشة تقدم الطلاب ونتائج امتحانات منتصف الفصل الثاني",
    eventType: "PARENT_MEETING",
    eventDate: new Date("2026-04-24"),
    startTime: "16:00",
    endTime: "18:00",
    location: "قاعة المدرسة",
    status: "PLANNED",
    isPublic: true,
    targetAudience: "أولياء الأمور",
  },

  // === MAY 2026 ===
  {
    title: "معرض العلوم والتكنولوجيا",
    description: "معرض سنوي لعرض مشاريع الطلاب العلمية والتقنية",
    eventType: "ACADEMIC",
    eventDate: new Date("2026-05-10"),
    startTime: "09:00",
    endTime: "15:00",
    location: "المعمل والساحة",
    status: "PLANNED",
    isPublic: true,
    targetAudience: "جميع الطلاب وأولياء الأمور",
  },
  {
    title: "بطولة كرة القدم بين الفصول",
    description:
      "بطولة كرة القدم السنوية بين فصول المرحلتين المتوسطة والثانوية",
    eventType: "SPORTS",
    eventDate: new Date("2026-05-17"),
    startTime: "14:00",
    endTime: "18:00",
    location: "الملعب الرئيسي",
    status: "PLANNED",
    isPublic: true,
  },
  {
    title: "عيد الأضحى المبارك",
    description: "عطلة عيد الأضحى المبارك",
    eventType: "CELEBRATION",
    eventDate: new Date("2026-05-27"),
    startTime: "00:00",
    endTime: "23:59",
    status: "PLANNED",
  },

  // === JUNE 2026 ===
  {
    title: "امتحانات نهاية الفصل الثاني",
    description: "الامتحانات النهائية للفصل الدراسي الثاني لجميع المراحل",
    eventType: "ACADEMIC",
    eventDate: new Date("2026-06-07"),
    startTime: "08:00",
    endTime: "14:00",
    location: "القاعات الدراسية",
    status: "PLANNED",
    targetAudience: "جميع الطلاب",
  },
  {
    title: "حفل نهاية العام وتكريم المتفوقين",
    description:
      "حفل نهاية العام الدراسي 2025-2026 مع تكريم الطلاب المتفوقين في جميع المراحل",
    eventType: "CELEBRATION",
    eventDate: new Date("2026-06-22"),
    startTime: "09:00",
    endTime: "13:00",
    location: "قاعة المدرسة",
    status: "PLANNED",
    isPublic: true,
    targetAudience: "جميع الطلاب وأولياء الأمور",
  },
  {
    title: "حفل تخرج الصف الثاني عشر",
    description: "حفل تخرج الدفعة الأولى من مدارس الملك فهد",
    eventType: "ACADEMIC",
    eventDate: new Date("2026-06-25"),
    startTime: "09:00",
    endTime: "13:00",
    location: "قاعة المدرسة",
    status: "PLANNED",
    isPublic: true,
    targetAudience: "طلاب الصف الثاني عشر وأسرهم",
  },
  {
    title: "بداية الإجازة الصيفية",
    description: "بداية إجازة الصيف — نتمنى لجميع الطلاب إجازة سعيدة وممتعة",
    eventType: "OTHER",
    eventDate: new Date("2026-06-28"),
    startTime: "12:00",
    endTime: "12:00",
    status: "PLANNED",
  },
]

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("🏫 KING FAHAD SCHOOLS — Content Seed")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

  // Find the school
  const school = await prisma.school.findUnique({
    where: { domain: "kingfahad" },
  })
  if (!school) {
    console.error(
      "❌ King Fahad school not found. Run seed-kingfahad.ts first."
    )
    process.exit(1)
  }
  console.log(`✅ School: ${school.name} (${school.id})`)

  // Find admin user
  const admin = await prisma.user.findFirst({
    where: { schoolId: school.id, role: "ADMIN" },
  })
  if (!admin) {
    console.error("❌ Admin user not found.")
    process.exit(1)
  }
  console.log(`✅ Admin: ${admin.email}`)

  // --- Seed Announcements ---
  console.log("\n📢 Seeding announcements...")
  let annCount = 0

  for (const ann of ANNOUNCEMENTS) {
    const existing = await prisma.announcement.findFirst({
      where: { schoolId: school.id, title: ann.title },
    })
    if (existing) continue

    await prisma.announcement.create({
      data: {
        schoolId: school.id,
        title: ann.title,
        body: ann.body,
        lang: "ar",
        scope: ann.scope,
        priority: ann.priority,
        published: true,
        publishedAt: ann.publishedAt,
        expiresAt: ann.expiresAt || null,
        pinned: ann.pinned || false,
        featured: ann.featured || false,
        createdBy: admin.id,
        role:
          ann.scope === "role"
            ? ann.title.includes("معلم")
              ? "TEACHER"
              : "GUARDIAN"
            : null,
      },
    })
    annCount++
  }
  console.log(`   ✅ Announcements: ${annCount} created`)

  // --- Seed Events ---
  console.log("\n📅 Seeding events...")
  let eventCount = 0

  for (const evt of EVENTS) {
    const existing = await prisma.event.findFirst({
      where: { schoolId: school.id, title: evt.title },
    })
    if (existing) continue

    await prisma.event.create({
      data: {
        schoolId: school.id,
        title: evt.title,
        description: evt.description,
        lang: "ar",
        eventType: evt.eventType,
        eventDate: evt.eventDate,
        startTime: evt.startTime,
        endTime: evt.endTime,
        location: evt.location || null,
        status: evt.status,
        isPublic: evt.isPublic || false,
        targetAudience: evt.targetAudience || null,
        createdById: admin.id,
      },
    })
    eventCount++
  }
  console.log(`   ✅ Events: ${eventCount} created`)

  // --- Seed Announcement Config ---
  console.log("\n⚙️  Seeding announcement config...")
  const existingConfig = await prisma.announcementConfig.findUnique({
    where: { schoolId: school.id },
  })
  if (!existingConfig) {
    await prisma.announcementConfig.create({
      data: {
        schoolId: school.id,
        defaultScope: "school",
        defaultPriority: "normal",
        autoPublish: false,
        defaultExpiryDays: 30,
        emailOnPublish: true,
        pushNotifications: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
        digestFrequency: "none",
        readTracking: true,
        retentionDays: 90,
        autoArchive: true,
        archiveAfterDays: 30,
      },
    })
    console.log("   ✅ Config created")
  } else {
    console.log("   ⏭️  Config already exists")
  }

  // --- Summary ---
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("✅ Content seed complete!")
  console.log(`   📢 ${annCount} announcements`)
  console.log(`   📅 ${eventCount} events`)
  console.log(`   ⚙️  Announcement config`)
  console.log("")
  console.log(
    "  Dashboard: https://kingfahad.databayt.org/ar/s/kingfahad/dashboard"
  )
  console.log(
    "  Announcements: https://kingfahad.databayt.org/ar/s/kingfahad/announcements"
  )
  console.log("  Events: https://kingfahad.databayt.org/ar/s/kingfahad/events")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
}

main()
  .catch((error) => {
    console.error("❌ Failed:", error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
