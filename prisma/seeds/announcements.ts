/**
 * Announcements Seed
 * Creates 25-30 announcements with temporal spread and MENA content
 *
 * Phase 9: Announcements & Events
 *
 * Features:
 * - 25-30 announcements spread across term (one every 3-5 days)
 * - Mix scopes: school (70%), class (20%), role (10%)
 * - MENA content: Ramadan schedule, winter uniform, extracurricular, safety drill, Quran competition
 * - Some with expiresAt (3-4 already expired)
 * - 1-2 pinned/featured
 */

import type { PrismaClient } from "@prisma/client"

import type { UserRef } from "./types"
import { logPhase, logSuccess } from "./utils"

// ============================================================================
// ANNOUNCEMENT DATA
// ============================================================================

interface AnnouncementSeed {
  title: string
  body: string
  scope: "school" | "class" | "role"
  priority: "low" | "normal" | "high" | "urgent"
  daysFromTermStart: number // Days from Sep 1 to set publishedAt
  expiresInDays?: number // Days after publish to expire (undefined = no expiry)
  pinned?: boolean
  featured?: boolean
}

const ANNOUNCEMENTS: AnnouncementSeed[] = [
  // Week 1 - Welcome
  {
    title: "مرحباً بكم في العام الدراسي 2025-2026",
    body: "يسرنا الترحيب بجميع الطلاب وأولياء الأمور والموظفين في العام الدراسي الجديد. لنجعل هذا العام ناجحاً ومثمراً بإذن الله!",
    scope: "school",
    priority: "high",
    daysFromTermStart: 0,
    pinned: true,
    featured: true,
  },
  {
    title: "الجدول الدراسي والكتب المطلوبة",
    body: "تم نشر الجدول الدراسي للفصل الأول. يمكنكم الاطلاع عليه عبر البوابة الإلكترونية. كما يرجى التأكد من اقتناء جميع الكتب المدرسية المطلوبة.",
    scope: "school",
    priority: "high",
    daysFromTermStart: 2,
    expiresInDays: 14,
  },

  // Week 2
  {
    title: "تذكير بالزي المدرسي",
    body: "يجب على جميع الطلاب الالتزام بالزي المدرسي الرسمي اعتباراً من الأسبوع الثاني. الزي متوفر في مكتبة المدرسة.",
    scope: "school",
    priority: "normal",
    daysFromTermStart: 7,
    expiresInDays: 21,
  },
  {
    title: "التسجيل في الأنشطة اللاصفية",
    body: "باب التسجيل مفتوح للأنشطة اللاصفية: كرة القدم، السباحة، الشطرنج، الخط العربي، نادي العلوم، نادي القراءة. سجل الآن عبر البوابة الإلكترونية!",
    scope: "school",
    priority: "normal",
    daysFromTermStart: 10,
    expiresInDays: 14,
  },

  // Week 3-4
  {
    title: "اجتماع أولياء الأمور - الفصل الأول",
    body: "سيعقد اجتماع أولياء الأمور والمعلمين يوم الخميس 2 أكتوبر. يرجى حضور جميع أولياء الأمور.",
    scope: "school",
    priority: "high",
    daysFromTermStart: 18,
    expiresInDays: 14,
  },
  {
    title: "الكتب الجديدة في المكتبة",
    body: "تم تزويد المكتبة بمجموعة جديدة من الكتب التعليمية والأدبية. ندعو جميع الطلاب لزيارة المكتبة والاستفادة من المصادر الجديدة.",
    scope: "school",
    priority: "normal",
    daysFromTermStart: 22,
  },

  // Week 5-6
  {
    title: "تمرين إخلاء المبنى",
    body: "سيتم إجراء تمرين إخلاء المبنى يوم الثلاثاء القادم. يرجى من جميع الطلاب والموظفين اتباع تعليمات السلامة.",
    scope: "school",
    priority: "urgent",
    daysFromTermStart: 28,
    expiresInDays: 7,
  },
  {
    title: "نتائج مسابقة الخط العربي",
    body: "تهانينا للفائزين في مسابقة الخط العربي! المركز الأول: أحمد محمد، المركز الثاني: فاطمة حسن، المركز الثالث: عمر إبراهيم.",
    scope: "school",
    priority: "normal",
    daysFromTermStart: 32,
  },

  // Week 7-8 - Exam preparation
  {
    title: "إعلان جدول امتحانات منتصف الفصل",
    body: "تم نشر جدول امتحانات منتصف الفصل الأول (20-30 أكتوبر). يرجى مراجعة الجدول عبر البوابة الإلكترونية والبدء بالمراجعة.",
    scope: "school",
    priority: "high",
    daysFromTermStart: 40,
    featured: true,
  },
  {
    title: "إرشادات الامتحانات",
    body: "تذكير بقواعد الامتحانات: الحضور قبل 15 دقيقة من بدء الامتحان، إحضار الأدوات اللازمة، الالتزام بالهدوء، عدم استخدام الهاتف.",
    scope: "school",
    priority: "high",
    daysFromTermStart: 47,
    expiresInDays: 14,
  },

  // Week 9-10
  {
    title: "التسجيل في معرض العلوم",
    body: "معرض العلوم السنوي قادم! سجل مشروعك العلمي قبل 10 نوفمبر. المشاريع الفردية والجماعية مرحب بها.",
    scope: "school",
    priority: "normal",
    daysFromTermStart: 55,
  },
  {
    title: "تغيير الزي الشتوي",
    body: "اعتباراً من الأسبوع القادم، يمكن للطلاب ارتداء الزي الشتوي (السترة الزرقاء). الزي الشتوي متوفر في مكتبة المدرسة.",
    scope: "school",
    priority: "normal",
    daysFromTermStart: 60,
  },

  // Week 11-12
  {
    title: "مسابقة القرآن الكريم",
    body: "التسجيل مفتوح لمسابقة القرآن الكريم السنوية. الفئات: حفظ 5 أجزاء، 10 أجزاء، 20 جزءاً، القرآن كاملاً. آخر موعد للتسجيل: 20 نوفمبر.",
    scope: "school",
    priority: "high",
    daysFromTermStart: 70,
    pinned: true,
  },
  {
    title: "يوم المعلم - تكريم المعلمين",
    body: "احتفلنا اليوم بيوم المعلم وتم تكريم المعلمين المتميزين. شكراً لجميع المعلمين على جهودهم المخلصة.",
    scope: "school",
    priority: "normal",
    daysFromTermStart: 46,
  },

  // Week 13-14 - End of term prep
  {
    title: "جدول امتحانات نهاية الفصل الأول",
    body: "تم نشر جدول الامتحانات النهائية (7-18 ديسمبر). يرجى الاستعداد مبكراً ومراجعة جميع المواد.",
    scope: "school",
    priority: "high",
    daysFromTermStart: 85,
  },
  {
    title: "مواعيد إجازة الشتاء",
    body: "تبدأ إجازة الشتاء يوم 20 ديسمبر وتنتهي يوم 9 يناير 2026. نتمنى لكم إجازة سعيدة!",
    scope: "school",
    priority: "normal",
    daysFromTermStart: 95,
  },

  // Class-scoped announcements (20%)
  {
    title: "واجب الرياضيات - الوحدة الثالثة",
    body: "يرجى حل تمارين الوحدة الثالثة (صفحات 45-50) وتسليمها يوم الخميس القادم.",
    scope: "class",
    priority: "normal",
    daysFromTermStart: 25,
    expiresInDays: 7,
  },
  {
    title: "رحلة ميدانية - متحف التاريخ",
    body: "ستقوم فصول الصف التاسع برحلة إلى متحف التاريخ يوم الأربعاء القادم. يرجى إحضار إذن ولي الأمر.",
    scope: "class",
    priority: "normal",
    daysFromTermStart: 35,
    expiresInDays: 10,
  },
  {
    title: "مشروع البحث العلمي - فصول العاشر",
    body: "آخر موعد لتسليم مشروع البحث العلمي هو 15 نوفمبر. يرجى الالتزام بالمواعيد.",
    scope: "class",
    priority: "high",
    daysFromTermStart: 50,
    expiresInDays: 25,
  },
  {
    title: "نتائج الاختبار القصير - اللغة العربية",
    body: "تم رصد نتائج الاختبار القصير. يمكنكم مراجعة الدرجات عبر البوابة.",
    scope: "class",
    priority: "normal",
    daysFromTermStart: 42,
  },
  {
    title: "حصة تعويضية - الفيزياء",
    body: "ستعقد حصة تعويضية في مادة الفيزياء يوم السبت القادم من 9-11 صباحاً في المختبر.",
    scope: "class",
    priority: "normal",
    daysFromTermStart: 65,
    expiresInDays: 5,
  },

  // Role-scoped announcements (10%)
  {
    title: "تحديث بيانات أولياء الأمور",
    body: "يرجى من جميع أولياء الأمور تحديث بيانات الاتصال عبر البوابة الإلكترونية قبل نهاية سبتمبر.",
    scope: "role",
    priority: "normal",
    daysFromTermStart: 14,
    expiresInDays: 16,
  },
  {
    title: "اجتماع المعلمين - التطوير المهني",
    body: "يُعقد اجتماع التطوير المهني للمعلمين يوم السبت القادم. الحضور إلزامي.",
    scope: "role",
    priority: "high",
    daysFromTermStart: 30,
    expiresInDays: 7,
  },
  {
    title: "تقييم أداء المعلمين - الفصل الأول",
    body: "سيبدأ تقييم أداء المعلمين للفصل الأول. يرجى تجهيز ملفات الإنجاز.",
    scope: "role",
    priority: "normal",
    daysFromTermStart: 80,
  },
]

// ============================================================================
// ANNOUNCEMENTS SEEDING
// ============================================================================

export async function seedAnnouncements(
  prisma: PrismaClient,
  schoolId: string,
  adminUsers: UserRef[]
): Promise<number> {
  logPhase(7, "ANNOUNCEMENTS & EVENTS", "الإعلانات والفعاليات")

  const admin = adminUsers.find((u) => u.role === "ADMIN") || adminUsers[0]
  if (!admin) return 0

  // Get some classes for class-scoped announcements
  const classes = await prisma.class.findMany({
    where: { schoolId },
    select: { id: true },
    take: 10,
  })

  let count = 0
  const termStart = new Date("2025-09-01")

  for (const ann of ANNOUNCEMENTS) {
    const publishedAt = new Date(termStart)
    publishedAt.setDate(publishedAt.getDate() + ann.daysFromTermStart)

    let expiresAt: Date | null = null
    if (ann.expiresInDays) {
      expiresAt = new Date(publishedAt)
      expiresAt.setDate(expiresAt.getDate() + ann.expiresInDays)
    }

    // For class scope, assign a random class
    const classId =
      ann.scope === "class" && classes.length > 0
        ? classes[count % classes.length].id
        : null

    // For role scope, assign TEACHER or GUARDIAN
    const role =
      ann.scope === "role" ? (count % 2 === 0 ? "TEACHER" : "GUARDIAN") : null

    try {
      const existing = await prisma.announcement.findFirst({
        where: { schoolId, title: ann.title },
      })

      if (!existing) {
        await prisma.announcement.create({
          data: {
            schoolId,
            title: ann.title,
            body: ann.body,
            lang: "ar",
            scope: ann.scope,
            priority: ann.priority,
            published: true,
            publishedAt,
            expiresAt,
            pinned: ann.pinned || false,
            featured: ann.featured || false,
            createdBy: admin.id,
            classId,
            role: role as "TEACHER" | "GUARDIAN" | null,
          },
        })
        count++
      }
    } catch {
      // Skip duplicates
    }
  }

  logSuccess("Announcements", count, "temporal spread, mixed scopes")

  return count
}
