/**
 * Lessons Seed
 * Creates subject-specific lessons for classes with Arabic content
 *
 * Phase 7: LMS - Lessons
 *
 * Features:
 * - Subject-specific Arabic lesson templates (8-10 per subject group)
 * - Varied start/end times based on class period
 * - Status: COMPLETED for past dates, PLANNED for future
 */

import type { PrismaClient } from "@prisma/client"

import type { ClassRef } from "./types"
import { logPhase, logSuccess, processBatch } from "./utils"

// ============================================================================
// SUBJECT-SPECIFIC LESSON TEMPLATES
// ============================================================================

const SUBJECT_LESSON_TEMPLATES: Record<
  string,
  { title: string; description: string }[]
> = {
  "اللغة العربية": [
    {
      title: "أحكام النحو - المفعول به",
      description: "تعريف المفعول به وأحكامه وإعرابه مع أمثلة تطبيقية",
    },
    {
      title: "قراءة في نص أدبي",
      description: "قراءة وتحليل نص أدبي مع استخراج الأفكار الرئيسية",
    },
    {
      title: "الإملاء - الهمزة المتوسطة",
      description: "قواعد كتابة الهمزة المتوسطة على الألف والواو والياء",
    },
    {
      title: "التعبير الكتابي - المقال",
      description: "كتابة مقال وصفي مع التركيز على بناء الفقرات",
    },
    {
      title: "البلاغة - التشبيه والاستعارة",
      description: "دراسة أنواع التشبيه والاستعارة في النصوص الأدبية",
    },
    {
      title: "الحال والتمييز",
      description: "الفرق بين الحال والتمييز وإعراب كل منهما",
    },
    {
      title: "قصيدة شعرية - الشعر الحديث",
      description: "دراسة قصيدة من الشعر الحديث وتحليلها",
    },
    {
      title: "الأفعال الخمسة وإعرابها",
      description: "تصريف الأفعال الخمسة وعلامات إعرابها",
    },
    {
      title: "الخط العربي - خط النسخ",
      description: "تدريب على الكتابة بخط النسخ الواضح",
    },
    {
      title: "مراجعة شاملة - النحو والصرف",
      description: "مراجعة جميع القواعد النحوية والصرفية المدروسة",
    },
  ],
  "اللغة الإنجليزية": [
    {
      title: "Present Tense Review",
      description: "مراجعة شاملة لزمن المضارع البسيط والمستمر",
    },
    {
      title: "Reading Comprehension",
      description: "قراءة نص وفهم المعنى واستخراج المعلومات",
    },
    {
      title: "Writing - Paragraph Structure",
      description: "بناء الفقرة الإنجليزية: المقدمة والجسم والخاتمة",
    },
    {
      title: "Past Tense Forms",
      description: "الأفعال في الماضي البسيط والمستمر والتام",
    },
    {
      title: "Vocabulary Building",
      description: "توسيع المفردات من خلال النصوص والتمارين",
    },
    {
      title: "Listening & Speaking",
      description: "مهارات الاستماع والمحادثة في مواقف يومية",
    },
    {
      title: "Grammar - Conditionals",
      description: "الجمل الشرطية: النوع الأول والثاني والثالث",
    },
    {
      title: "Creative Writing",
      description: "كتابة إبداعية: قصة قصيرة أو وصف",
    },
    { title: "Exam Practice", description: "تدريب على نماذج الامتحانات" },
  ],
  الرياضيات: [
    {
      title: "الأعداد الصحيحة والعمليات عليها",
      description: "جمع وطرح وضرب وقسمة الأعداد الصحيحة",
    },
    {
      title: "المعادلات الخطية",
      description: "حل المعادلات الخطية بمجهول واحد",
    },
    {
      title: "الهندسة - المثلثات",
      description: "أنواع المثلثات وخصائصها وحساب المساحة والمحيط",
    },
    {
      title: "الكسور والعمليات عليها",
      description: "جمع وطرح وضرب وقسمة الكسور",
    },
    {
      title: "النسبة والتناسب",
      description: "مفهوم النسبة والتناسب وتطبيقاتهما",
    },
    {
      title: "المساحات والحجوم",
      description: "حساب مساحة وحجم الأشكال الهندسية",
    },
    {
      title: "الإحصاء والاحتمالات",
      description: "المتوسط الحسابي والوسيط والمنوال",
    },
    {
      title: "الجبر - كثيرات الحدود",
      description: "جمع وطرح وضرب كثيرات الحدود",
    },
    {
      title: "حل المشكلات الرياضية",
      description: "تطبيق المفاهيم الرياضية في حل مشكلات حياتية",
    },
    {
      title: "التحضير للامتحان",
      description: "مراجعة شاملة وحل تمارين تحضيرية",
    },
  ],
  الفيزياء: [
    { title: "الحركة والسرعة", description: "مفهوم الحركة والسرعة والتسارع" },
    {
      title: "قوانين نيوتن",
      description: "قوانين نيوتن الثلاثة للحركة مع تجارب عملية",
    },
    {
      title: "الطاقة الحركية والكامنة",
      description: "أشكال الطاقة وتحولاتها وقانون حفظ الطاقة",
    },
    {
      title: "الحرارة والديناميكا الحرارية",
      description: "انتقال الحرارة والتوصيل والحمل والإشعاع",
    },
    { title: "الموجات والصوت", description: "خصائص الموجات وانتشار الصوت" },
    {
      title: "الضوء والبصريات",
      description: "انكسار وانعكاس الضوء والمرايا والعدسات",
    },
    { title: "الكهرباء والتيار", description: "الدوائر الكهربائية وقانون أوم" },
    {
      title: "المغناطيسية",
      description: "المجال المغناطيسي والقوة المغناطيسية",
    },
    {
      title: "تجارب مختبرية",
      description: "تجارب عملية في المختبر لتطبيق المفاهيم",
    },
  ],
  الكيمياء: [
    { title: "بنية الذرة", description: "مكونات الذرة والنماذج الذرية" },
    {
      title: "الجدول الدوري",
      description: "تنظيم العناصر وخصائص المجموعات والدورات",
    },
    {
      title: "الروابط الكيميائية",
      description: "الروابط الأيونية والتساهمية والفلزية",
    },
    {
      title: "التفاعلات الكيميائية",
      description: "أنواع التفاعلات وموازنة المعادلات",
    },
    {
      title: "الأحماض والقواعد",
      description: "خصائص الأحماض والقواعد ومقياس pH",
    },
    {
      title: "المحاليل والتراكيز",
      description: "أنواع المحاليل وطرق حساب التركيز",
    },
    {
      title: "الكيمياء العضوية",
      description: "مقدمة في الهيدروكربونات والمركبات العضوية",
    },
    {
      title: "تجارب مختبرية",
      description: "تجارب كيميائية عملية مع إجراءات السلامة",
    },
  ],
  الأحياء: [
    {
      title: "الخلية ومكوناتها",
      description: "تركيب الخلية الحيوانية والنباتية",
    },
    {
      title: "الانقسام الخلوي",
      description: "الانقسام المتساوي والمنصف ومراحلهما",
    },
    {
      title: "الوراثة وقوانين مندل",
      description: "الصفات الوراثية والسائدة والمتنحية",
    },
    {
      title: "التصنيف والتنوع الحيوي",
      description: "تصنيف الكائنات الحية ومستويات التصنيف",
    },
    { title: "الجهاز الهضمي", description: "أعضاء الجهاز الهضمي وعملية الهضم" },
    {
      title: "الجهاز الدوري",
      description: "القلب والأوعية الدموية ودورة الدم",
    },
    {
      title: "البيئة والنظام البيئي",
      description: "العلاقات البيئية والسلاسل الغذائية",
    },
    {
      title: "تجارب مختبرية - المجهر",
      description: "استخدام المجهر لدراسة الخلايا والأنسجة",
    },
  ],
  "التربية الإسلامية": [
    {
      title: "سورة الحجرات - الآداب",
      description: "دراسة آداب التعامل في سورة الحجرات",
    },
    {
      title: "السيرة النبوية - غزوة بدر",
      description: "أحداث غزوة بدر ودروسها المستفادة",
    },
    { title: "أحكام الصلاة", description: "شروط وأركان وواجبات الصلاة" },
    {
      title: "العقيدة - أركان الإيمان",
      description: "دراسة أركان الإيمان الستة بالتفصيل",
    },
    {
      title: "الأخلاق الإسلامية - الصدق والأمانة",
      description: "فضل الصدق والأمانة في الإسلام",
    },
    { title: "فقه المعاملات", description: "أحكام البيع والشراء في الإسلام" },
    {
      title: "قصص الأنبياء - يوسف عليه السلام",
      description: "قصة نبي الله يوسف والعبر المستفادة",
    },
    { title: "أحكام الصيام", description: "شروط وجوب الصيام ومبطلاته وفضله" },
    {
      title: "التفسير - سورة الرحمن",
      description: "تفسير مقتطفات من سورة الرحمن",
    },
    { title: "مراجعة شاملة", description: "مراجعة جميع المواضيع المدروسة" },
  ],
  "القرآن الكريم": [
    {
      title: "حفظ سورة الملك (1-10)",
      description: "حفظ وتسميع الآيات 1-10 من سورة الملك",
    },
    {
      title: "أحكام التجويد - المد",
      description: "أنواع المد الطبيعي والفرعي وأحكامه",
    },
    {
      title: "تلاوة سورة يس",
      description: "تلاوة سورة يس مع تطبيق أحكام التجويد",
    },
    {
      title: "حفظ سورة الملك (11-20)",
      description: "حفظ وتسميع الآيات 11-20 من سورة الملك",
    },
    {
      title: "أحكام النون الساكنة والتنوين",
      description: "الإظهار والإدغام والإقلاب والإخفاء",
    },
    {
      title: "تلاوة سورة الواقعة",
      description: "تلاوة سورة الواقعة مع التجويد",
    },
    {
      title: "حفظ سورة الملك (21-30)",
      description: "حفظ وتسميع الآيات 21-30 من سورة الملك",
    },
    {
      title: "مراجعة الحفظ والتسميع",
      description: "مراجعة شاملة لجميع السور المحفوظة",
    },
    {
      title: "مسابقة التلاوة",
      description: "مسابقة تلاوة القرآن الكريم بين الطلاب",
    },
  ],
  العلوم: [
    {
      title: "حالات المادة الثلاث",
      description: "الحالة الصلبة والسائلة والغازية",
    },
    { title: "النباتات وأجزاؤها", description: "الجذر والساق والورقة والزهرة" },
    {
      title: "الحيوانات وتصنيفها",
      description: "الثدييات والطيور والزواحف والبرمائيات",
    },
    {
      title: "جسم الإنسان - الحواس الخمس",
      description: "البصر والسمع والشم والتذوق واللمس",
    },
    { title: "الطقس والمناخ", description: "عناصر الطقس وأدوات قياسه" },
    { title: "دورة الماء في الطبيعة", description: "التبخر والتكاثف والهطول" },
    { title: "المجموعة الشمسية", description: "الشمس والكواكب والأقمار" },
    {
      title: "الكائنات الحية والبيئة",
      description: "العلاقات بين الكائنات الحية وبيئتها",
    },
    {
      title: "تجارب علمية بسيطة",
      description: "تجارب عملية لفهم الظواهر الطبيعية",
    },
  ],
  الحاسوب: [
    {
      title: "مقدمة في الحاسوب",
      description: "مكونات الحاسوب المادية والبرمجية",
    },
    { title: "معالجة النصوص", description: "استخدام برنامج معالجة النصوص" },
    {
      title: "الجداول الإلكترونية",
      description: "إنشاء الجداول والرسوم البيانية",
    },
    { title: "العروض التقديمية", description: "تصميم عروض تقديمية احترافية" },
    {
      title: "أساسيات البرمجة",
      description: "مفاهيم البرمجة الأساسية والخوارزميات",
    },
    {
      title: "الإنترنت والسلامة الرقمية",
      description: "استخدام الإنترنت بأمان وحماية الخصوصية",
    },
    { title: "مشروع تطبيقي", description: "تنفيذ مشروع حاسوبي متكامل" },
  ],
  "علوم الحاسوب": [
    {
      title: "مقدمة في البرمجة",
      description: "أساسيات البرمجة والتفكير المنطقي",
    },
    { title: "هياكل البيانات", description: "المصفوفات والقوائم والأشجار" },
    { title: "الخوارزميات", description: "تصميم وتحليل الخوارزميات" },
    { title: "قواعد البيانات", description: "مفاهيم قواعد البيانات العلائقية" },
    {
      title: "الشبكات والاتصالات",
      description: "أساسيات شبكات الحاسوب والبروتوكولات",
    },
    { title: "الأمن السيبراني", description: "مفاهيم أساسية في أمن المعلومات" },
    { title: "مشروع برمجي", description: "تنفيذ مشروع برمجي متكامل" },
  ],
}

// Fallback for unmapped subjects
const FALLBACK_TEMPLATES = [
  { title: "مقدمة في المادة", description: "تعريف بالمادة وأهدافها ومحتواها" },
  {
    title: "المفاهيم الأساسية",
    description: "دراسة المفاهيم والمبادئ الأساسية",
  },
  { title: "تطبيقات عملية", description: "تطبيق المفاهيم في مواقف عملية" },
  { title: "أنشطة تفاعلية", description: "أنشطة جماعية وتفاعلية لتعزيز الفهم" },
  { title: "تمارين وتدريبات", description: "حل تمارين وتدريبات متنوعة" },
  { title: "مشروع جماعي", description: "العمل على مشروع جماعي تعاوني" },
  { title: "مراجعة شاملة", description: "مراجعة جميع المواضيع المدروسة" },
  { title: "التحضير للتقييم", description: "تدريب على نماذج أسئلة الامتحان" },
]

// Period times for varied scheduling
const PERIOD_TIMES = [
  { start: "07:45", end: "08:30" },
  { start: "08:35", end: "09:20" },
  { start: "09:25", end: "10:10" },
  { start: "10:30", end: "11:15" },
  { start: "11:20", end: "12:05" },
  { start: "12:10", end: "12:55" },
  { start: "13:25", end: "14:10" },
  { start: "14:15", end: "15:00" },
]

// ============================================================================
// LESSONS SEEDING
// ============================================================================

/**
 * Get templates for a given subject name
 */
function getTemplatesForSubject(
  subjectName: string
): { title: string; description: string }[] {
  // Direct match
  if (SUBJECT_LESSON_TEMPLATES[subjectName]) {
    return SUBJECT_LESSON_TEMPLATES[subjectName]
  }
  // Partial match
  for (const [key, templates] of Object.entries(SUBJECT_LESSON_TEMPLATES)) {
    if (subjectName.includes(key) || key.includes(subjectName)) {
      return templates
    }
  }
  return FALLBACK_TEMPLATES
}

export async function seedLessons(
  prisma: PrismaClient,
  schoolId: string,
  classes: ClassRef[]
): Promise<number> {
  logPhase(5, "LMS / STREAM", "نظام إدارة التعلم")

  let lessonCount = 0
  const termStart = new Date("2025-09-01")
  const today = new Date()

  await processBatch(classes, 10, async (classInfo) => {
    // Get subject name from class name (format: "subjectName - yearLevel/section")
    // The classInfo.name contains the class name; we need to find the subject
    // We'll look up the subject via subjectId
    const subject = await prisma.subject.findUnique({
      where: { id: classInfo.subjectId },
      select: { subjectName: true },
    })

    const subjectName = subject?.subjectName || ""
    const templates = getTemplatesForSubject(subjectName)

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i]
      const lessonTitle = `${template.title} - ${classInfo.name}`

      // Calculate lesson date based on week
      const lessonDate = new Date(termStart)
      lessonDate.setDate(lessonDate.getDate() + i * 7)

      // Vary period times
      const periodTime = PERIOD_TIMES[i % PERIOD_TIMES.length]

      // Status based on date
      const status = lessonDate < today ? "COMPLETED" : "PLANNED"

      try {
        const existing = await prisma.lesson.findFirst({
          where: { schoolId, classId: classInfo.id, title: lessonTitle },
        })

        if (!existing) {
          await prisma.lesson.create({
            data: {
              schoolId,
              classId: classInfo.id,
              title: lessonTitle,
              description: template.description,
              lessonDate,
              startTime: periodTime.start,
              endTime: periodTime.end,
              objectives: `أهداف التعلم: ${template.title}`,
              materials: "الكتاب المدرسي، الدفتر، القلم",
              activities: "شرح، مناقشة، تمارين تطبيقية",
              status,
            },
          })
          lessonCount++
        }
      } catch {
        // Skip duplicates
      }
    }
  })

  logSuccess("Lessons", lessonCount, "subject-specific Arabic templates")

  return lessonCount
}
