/**
 * Announcements Seed Module
 * Creates school announcements - Comboni School (Full K-12)
 */

import { AnnouncementScope } from "@prisma/client";
import type { SeedPrisma, ClassRef } from "./types";

export async function seedAnnouncements(
  prisma: SeedPrisma,
  schoolId: string,
  classes: ClassRef[]
): Promise<void> {
  console.log("📢 Creating announcements (Comboni School)...");

  const announcements = [
    {
      title: "مرحباً بكم في العام الدراسي 2025-2026 | Welcome to Academic Year 2025-2026",
      body: `أهلاً وسهلاً بجميع الطلاب وأولياء الأمور في مدرسة كمبوني.

Welcome to Comboni School. In the spirit of Saint Daniel Comboni's vision for excellence in African education, we look forward to another year of academic achievement and character formation.

"إلى الأمام دائماً" - Always Forward!`,
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "جدول امتحانات منتصف الفصل | Mid-Term Examination Schedule",
      body: `تم نشر جدول امتحانات منتصف الفصل الدراسي الأول. يرجى مراجعة قسم الجدول الزمني للاطلاع على التفاصيل.

The mid-term examination schedule has been published. Students are expected to maintain the high standards of academic excellence that Comboni schools are known for across Sudan.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "اجتماع أولياء الأمور والمعلمين | Parent-Teacher Conference",
      body: `يسرنا دعوة جميع أولياء الأمور لحضور اجتماع أولياء الأمور والمعلمين يوم الخميس القادم.

We invite all parents to attend our quarterly parent-teacher conference. Your involvement in your child's education is central to the Comboni tradition of holistic education.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "وصول كتب جديدة للمكتبة | Library: New Arabic & English Books",
      body: `تم تزويد مكتبة المدرسة بمجموعة جديدة من الكتب تشمل أعمال الطيب صالح ونجيب محفوظ والكتب العلمية باللغتين العربية والإنجليزية.

The library has received new books including works by Sudanese author Tayeb Salih, Arabic literature classics, and scientific textbooks in both Arabic and English.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "يوم الرياضة السنوي | Annual Sports Day",
      body: `سيقام يوم الرياضة السنوي الشهر القادم. جميع الطلاب مدعوون للمشاركة.

Annual Sports Day will be held next month. All students are encouraged to participate and represent their houses with honor.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "معرض العلوم والتكنولوجيا | Science & Technology Fair",
      body: `باب التسجيل مفتوح لمعرض العلوم والتكنولوجيا السنوي. الموعد النهائي لتقديم المشاريع نهاية الشهر.

Registration for the annual Science & Technology Fair is now open. Comboni students have consistently excelled in scientific competitions across Sudan.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "عطلة عيد الفطر المبارك | Eid al-Fitr Holiday Notice",
      body: `تهنئة بمناسبة شهر رمضان المبارك. ستبقى المدرسة مغلقة خلال إجازة عيد الفطر.

Ramadan Mubarak to our school community! School will remain closed during the Eid al-Fitr holiday. We wish all families blessed celebrations.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "ذكرى تأسيس مدارس كمبوني | Comboni Schools Anniversary",
      body: `نحتفل هذا العام بذكرى تأسيس مدارس كمبوني في السودان منذ عام 1900. شكراً للقديس دانيال كمبوني على رؤيته للتعليم في أفريقيا.

This year we celebrate the legacy of Comboni Schools in Sudan since 1900. Saint Daniel Comboni's vision continues to inspire excellence in education across Africa.`,
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "تسليم الواجب | Assignment Deadline Reminder",
      body: `تذكير: موعد تسليم الواجب يوم الخميس. يرجى التسليم في الوقت المحدد.

Reminder: Your assignment is due this Thursday. Please submit on time to maintain academic excellence.`,
      scope: AnnouncementScope.class,
      classId: classes[0]?.id,
      published: true,
    },
    {
      title: "رحلة ميدانية | Educational Field Trip",
      body: `سيتم تنظيم رحلة ميدانية تعليمية لطلاب الجغرافيا والتاريخ. يرجى الحصول على إذن ولي الأمر.

An educational field trip is planned for Geography and History students. Please obtain parent permission forms from the administration office.`,
      scope: AnnouncementScope.school,
      published: true,
    },
  ];

  for (const ann of announcements) {
    await prisma.announcement.create({
      data: { schoolId, ...ann },
    });
  }

  console.log(`   ✅ Created: ${announcements.length} bilingual announcements (Arabic/English)\n`);
}
