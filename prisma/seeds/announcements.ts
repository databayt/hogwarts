/**
 * Announcements Seed Module
 * Creates bilingual school announcements - Comboni School (Full K-12)
 * Each announcement has English and Arabic versions with fallback support
 */

import { AnnouncementScope } from "@prisma/client";
import type { SeedPrisma, ClassRef } from "./types";

export async function seedAnnouncements(
  prisma: SeedPrisma,
  schoolId: string,
  classes: ClassRef[]
): Promise<void> {
  console.log("📢 Creating bilingual announcements (Comboni School)...");

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
    // Draft announcement (unpublished) - only English
    {
      titleEn: "Upcoming School Renovation",
      titleAr: null, // Arabic version pending
      bodyEn: `We are planning renovations to the science lab facilities. More details will be shared soon.`,
      bodyAr: null,
      scope: AnnouncementScope.school,
      published: false,
    },
  ];

  for (const ann of announcements) {
    await prisma.announcement.create({
      data: { schoolId, ...ann },
    });
  }

  console.log(`   ✅ Created: ${announcements.length} bilingual announcements (EN/AR with fallback)\n`);
}
