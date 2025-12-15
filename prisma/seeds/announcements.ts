/**
 * Announcements Seed Module
 * Creates bilingual school announcements - Comboni School (Full K-12)
 * Each announcement has English and Arabic versions with fallback support
 */

import { AnnouncementScope } from "@prisma/client"

import type { ClassRef, SeedPrisma } from "./types"

export async function seedAnnouncements(
  prisma: SeedPrisma,
  schoolId: string,
  classes: ClassRef[]
): Promise<void> {
  console.log("📢 Creating bilingual announcements (Comboni School)...")

  const announcements = [
    {
      titleEn: "Welcome to Academic Year 2025-2026",
      titleAr: "مرحباً بكم في العام الدراسي 2025-2026",
      bodyEn: `Welcome to Comboni School. In the spirit of Saint Daniel Comboni's vision for excellence in African education, we look forward to another year of academic achievement and character formation.

"Always Forward!"`,
      bodyAr: `أهلاً وسهلاً بجميع الطلاب وأولياء الأمور في مدرسة كمبوني.

نتطلع إلى عام آخر من التميز الأكاديمي وبناء الشخصية وفقاً لرؤية القديس دانيال كمبوني للتعليم في أفريقيا.

"إلى الأمام دائماً"`,
      scope: AnnouncementScope.school,
      published: true,
      pinned: true,
    },
    {
      titleEn: "Mid-Term Examination Schedule",
      titleAr: "جدول امتحانات منتصف الفصل",
      bodyEn: `The mid-term examination schedule has been published. Students are expected to maintain the high standards of academic excellence that Comboni schools are known for across Sudan.

Please check the timetable section for details.`,
      bodyAr: `تم نشر جدول امتحانات منتصف الفصل الدراسي الأول.

يرجى مراجعة قسم الجدول الزمني للاطلاع على التفاصيل.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      titleEn: "Parent-Teacher Conference",
      titleAr: "اجتماع أولياء الأمور والمعلمين",
      bodyEn: `We invite all parents to attend our quarterly parent-teacher conference. Your involvement in your child's education is central to the Comboni tradition of holistic education.

Date: Next Thursday
Time: 4:00 PM - 7:00 PM`,
      bodyAr: `يسرنا دعوة جميع أولياء الأمور لحضور اجتماع أولياء الأمور والمعلمين الفصلي.

التاريخ: الخميس القادم
الوقت: 4:00 مساءً - 7:00 مساءً`,
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      titleEn: "Library: New Arabic & English Books",
      titleAr: "وصول كتب جديدة للمكتبة",
      bodyEn: `The library has received new books including works by Sudanese author Tayeb Salih, Arabic literature classics, and scientific textbooks in both Arabic and English.

Visit the library to explore the new collection!`,
      bodyAr: `تم تزويد مكتبة المدرسة بمجموعة جديدة من الكتب تشمل أعمال الطيب صالح ونجيب محفوظ والكتب العلمية باللغتين العربية والإنجليزية.

زوروا المكتبة للاطلاع على المجموعة الجديدة!`,
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      titleEn: "Annual Sports Day",
      titleAr: "يوم الرياضة السنوي",
      bodyEn: `Annual Sports Day will be held next month. All students are encouraged to participate and represent their houses with honor.

Registration is now open at the PE department.`,
      bodyAr: `سيقام يوم الرياضة السنوي الشهر القادم. جميع الطلاب مدعوون للمشاركة.

التسجيل مفتوح الآن في قسم التربية البدنية.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      titleEn: "Science & Technology Fair",
      titleAr: "معرض العلوم والتكنولوجيا",
      bodyEn: `Registration for the annual Science & Technology Fair is now open. Comboni students have consistently excelled in scientific competitions across Sudan.

Project submission deadline: End of this month.`,
      bodyAr: `باب التسجيل مفتوح لمعرض العلوم والتكنولوجيا السنوي.

الموعد النهائي لتقديم المشاريع: نهاية الشهر الحالي.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      titleEn: "Eid al-Fitr Holiday Notice",
      titleAr: "عطلة عيد الفطر المبارك",
      bodyEn: `Ramadan Mubarak to our school community! School will remain closed during the Eid al-Fitr holiday.

We wish all families blessed celebrations.`,
      bodyAr: `تهنئة بمناسبة شهر رمضان المبارك. ستبقى المدرسة مغلقة خلال إجازة عيد الفطر.

كل عام وأنتم بخير.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      titleEn: "Comboni Schools Anniversary",
      titleAr: "ذكرى تأسيس مدارس كمبوني",
      bodyEn: `This year we celebrate the legacy of Comboni Schools in Sudan since 1900. Saint Daniel Comboni's vision continues to inspire excellence in education across Africa.`,
      bodyAr: `نحتفل هذا العام بذكرى تأسيس مدارس كمبوني في السودان منذ عام 1900. شكراً للقديس دانيال كمبوني على رؤيته للتعليم في أفريقيا.`,
      scope: AnnouncementScope.school,
      published: true,
      featured: true,
    },
    {
      titleEn: "Assignment Deadline Reminder",
      titleAr: "تذكير: موعد تسليم الواجب",
      bodyEn: `Reminder: Your assignment is due this Thursday. Please submit on time to maintain academic excellence.`,
      bodyAr: `تذكير: موعد تسليم الواجب يوم الخميس. يرجى التسليم في الوقت المحدد.`,
      scope: AnnouncementScope.class,
      classId: classes[0]?.id,
      published: true,
    },
    {
      titleEn: "Educational Field Trip",
      titleAr: "رحلة ميدانية تعليمية",
      bodyEn: `An educational field trip is planned for Geography and History students. Please obtain parent permission forms from the administration office.`,
      bodyAr: `سيتم تنظيم رحلة ميدانية تعليمية لطلاب الجغرافيا والتاريخ. يرجى الحصول على إذن ولي الأمر من مكتب الإدارة.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    // Health & Safety
    {
      titleEn: "Health Guidelines Update",
      titleAr: "تحديث الإرشادات الصحية",
      bodyEn: `Please ensure your children follow basic health guidelines:
- Wash hands frequently
- Bring personal water bottles
- Report any illness to the nurse's office

Contact the health office for any concerns.`,
      bodyAr: `يرجى التأكد من اتباع أبنائكم للإرشادات الصحية الأساسية:
- غسل اليدين بانتظام
- إحضار زجاجة ماء شخصية
- الإبلاغ عن أي مرض لمكتب الممرضة

للاستفسارات، تواصلوا مع المكتب الصحي.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    // Academic Excellence
    {
      titleEn: "Congratulations to Honor Roll Students",
      titleAr: "تهنئة للطلاب المتفوقين",
      bodyEn: `We are proud to announce the first term Honor Roll students. Their dedication to academic excellence exemplifies the Comboni tradition.

Special recognition assembly will be held next week. Parents are invited to attend.

"العلم نور والجهل ظلام"`,
      bodyAr: `يسرنا الإعلان عن الطلاب المتفوقين في الفصل الدراسي الأول. تفانيهم يجسد تقاليد التميز في مدارس كمبوني.

سيقام حفل تكريم خاص الأسبوع القادم. ندعو أولياء الأمور للحضور.

"العلم نور والجهل ظلام"`,
      scope: AnnouncementScope.school,
      published: true,
      pinned: true,
    },
    // Uniform Reminder
    {
      titleEn: "School Uniform Reminder",
      titleAr: "تذكير بالزي المدرسي",
      bodyEn: `All students must adhere to the school uniform policy:
- White shirt and navy trousers/skirt
- School tie (grades 7-12)
- Black shoes (no sports shoes)
- Hair must be neat and tidy

Non-compliance will result in a note to parents.`,
      bodyAr: `على جميع الطلاب الالتزام بسياسة الزي المدرسي:
- قميص أبيض وبنطلون/تنورة كحلي
- ربطة عنق المدرسة (الصفوف 7-12)
- حذاء أسود (ممنوع الأحذية الرياضية)
- الشعر يجب أن يكون مرتباً ونظيفاً

عدم الالتزام سيؤدي إلى إرسال ملاحظة لولي الأمر.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    // Transportation
    {
      titleEn: "School Bus Routes Updated",
      titleAr: "تحديث مسارات الحافلات المدرسية",
      bodyEn: `New bus routes have been updated for this semester. Please check the transportation office for your child's route and timing.

Routes cover: Riyadh, Amarat, Khartoum 2, Burri, and surrounding areas.`,
      bodyAr: `تم تحديث مسارات الحافلات المدرسية لهذا الفصل. يرجى مراجعة مكتب النقل لمعرفة مسار ووقت طفلكم.

تغطي المسارات: الرياض، الأمارات، الخرطوم 2، بري، والمناطق المجاورة.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    // Quran Competition
    {
      titleEn: "Quran Memorization Competition Registration",
      titleAr: "التسجيل في مسابقة حفظ القرآن الكريم",
      bodyEn: `Registration is now open for the annual Quran Memorization Competition.

Categories:
- 5 Juz Memorization
- 10 Juz Memorization
- Full Quran Memorization

Register at the Islamic Studies Department by end of month.

"خيركم من تعلم القرآن وعلمه"`,
      bodyAr: `التسجيل مفتوح الآن لمسابقة حفظ القرآن الكريم السنوية.

الفئات:
- حفظ 5 أجزاء
- حفظ 10 أجزاء
- حفظ القرآن كاملاً

سجل في قسم الدراسات الإسلامية قبل نهاية الشهر.

"خيركم من تعلم القرآن وعلمه"`,
      scope: AnnouncementScope.school,
      published: true,
      featured: true,
    },
    // Fee Payment
    {
      titleEn: "Second Installment Payment Due",
      titleAr: "موعد سداد القسط الثاني",
      bodyEn: `Reminder: The second fee installment is due by the 15th of this month.

Payment methods:
- Bank transfer (details in the fees section)
- Payment at the school finance office

Late payment will incur additional charges.`,
      bodyAr: `تذكير: موعد سداد القسط الثاني بحلول الخامس عشر من هذا الشهر.

طرق الدفع:
- تحويل بنكي (التفاصيل في قسم الرسوم)
- الدفع في مكتب الشؤون المالية

التأخير في السداد سيترتب عليه رسوم إضافية.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    // Extracurricular Activities
    {
      titleEn: "After-School Activities Registration",
      titleAr: "التسجيل في الأنشطة اللاصفية",
      bodyEn: `Registration for after-school activities is now open:

- Football Club (Mon & Wed)
- Basketball Club (Tue & Thu)
- Art Club (Monday)
- Science Club (Wednesday)
- Arabic Calligraphy (Thursday)
- Quran Circle (Sunday)

Limited spots available. Register at the Student Affairs office.`,
      bodyAr: `التسجيل مفتوح الآن للأنشطة اللاصفية:

- نادي كرة القدم (الاثنين والأربعاء)
- نادي كرة السلة (الثلاثاء والخميس)
- نادي الفنون (الاثنين)
- نادي العلوم (الأربعاء)
- ورشة الخط العربي (الخميس)
- حلقة القرآن (الأحد)

الأماكن محدودة. سجل في مكتب شؤون الطلاب.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    // Exam Preparation
    {
      titleEn: "Final Exam Preparation Tips",
      titleAr: "نصائح للاستعداد للامتحانات النهائية",
      bodyEn: `As we approach final exams, here are some tips:

1. Create a study schedule
2. Review class notes daily
3. Practice past exam papers
4. Get adequate sleep
5. Stay calm and focused

The library will have extended hours during exam period.

"من جد وجد، ومن زرع حصد"`,
      bodyAr: `مع اقتراب الامتحانات النهائية، إليكم بعض النصائح:

1. أعد جدولاً للمذاكرة
2. راجع ملاحظات الحصص يومياً
3. حل امتحانات السنوات السابقة
4. احصل على قسط كافٍ من النوم
5. كن هادئاً ومركزاً

ستكون المكتبة مفتوحة لساعات إضافية خلال فترة الامتحانات.

"من جد وجد، ومن زرع حصد"`,
      scope: AnnouncementScope.school,
      published: true,
    },
    // Summer Program
    {
      titleEn: "Summer Program Announcement",
      titleAr: "إعلان البرنامج الصيفي",
      bodyEn: `Registration for the summer program will open next month.

Programs available:
- Academic reinforcement
- Quran memorization camp
- Sports camp
- Art & craft workshops
- Computer skills training

Details and fees will be announced soon.`,
      bodyAr: `سيفتح التسجيل للبرنامج الصيفي الشهر القادم.

البرامج المتاحة:
- الدعم الأكاديمي
- معسكر حفظ القرآن
- المعسكر الرياضي
- ورش الفنون والحرف
- التدريب على مهارات الحاسوب

سيتم الإعلان عن التفاصيل والرسوم قريباً.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    // Safety Drill
    {
      titleEn: "Fire Drill Scheduled",
      titleAr: "تمرين إخلاء مبنى",
      bodyEn: `A fire drill will be conducted tomorrow during the second period.

All students and staff should:
- Follow teacher instructions
- Leave belongings behind
- Walk calmly to assembly points
- Wait for the all-clear signal

Safety is everyone's responsibility.`,
      bodyAr: `سيقام تمرين إخلاء غداً خلال الحصة الثانية.

على جميع الطلاب والموظفين:
- اتباع تعليمات المعلمين
- ترك الممتلكات
- المشي بهدوء نحو نقاط التجمع
- الانتظار حتى إشارة الأمان

السلامة مسؤولية الجميع.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    // Draft announcement (unpublished) - only English
    {
      titleEn: "Upcoming School Renovation",
      titleAr: null, // Arabic version pending
      bodyEn: `We are planning renovations to the science lab facilities. More details will be shared soon.`,
      bodyAr: null,
      scope: AnnouncementScope.school,
      published: false,
    },
  ]

  let createdCount = 0
  let skippedCount = 0

  for (const ann of announcements) {
    // Check if announcement already exists (by titleEn + schoolId)
    const existing = await prisma.announcement.findFirst({
      where: { schoolId, titleEn: ann.titleEn },
    })

    if (!existing) {
      await prisma.announcement.create({
        data: { schoolId, ...ann },
      })
      createdCount++
    } else {
      skippedCount++
    }
  }

  console.log(
    `   ✅ Announcements: ${createdCount} new, ${skippedCount} already existed\n`
  )
}
