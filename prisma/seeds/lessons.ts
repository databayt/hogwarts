/**
 * Lessons Seed Module
 * Creates lesson plans - Comboni School curriculum
 */

import { faker } from "@faker-js/faker";
import type { SeedPrisma, ClassRef } from "./types";

// Bilingual lesson topics (Arabic/English) - Comboni School curriculum
const LESSON_TOPICS = [
  { title: "مقدمة في الجبر | Introduction to Algebra", objectives: "فهم المفاهيم الجبرية الأساسية | Understand basic algebraic concepts" },
  { title: "النحو العربي: تصريف الأفعال | Arabic Grammar: Verb Conjugation", objectives: "إتقان تصريف الأفعال | Master verb conjugation in Arabic" },
  { title: "English Literature: Poetry Analysis", objectives: "Analyze poetic devices and literary techniques" },
  { title: "الفيزياء: قوانين نيوتن | Physics: Newton's Laws", objectives: "تطبيق قوانين نيوتن | Apply Newton's laws to solve problems" },
  { title: "الكيمياء: الجدول الدوري | Chemistry: Periodic Table", objectives: "فهم الاتجاهات الدورية | Understand periodic trends" },
  { title: "الأحياء: تركيب الخلية | Biology: Cell Structure", objectives: "تحديد عضيات الخلية | Identify cell organelles and their functions" },
  { title: "الجغرافيا: مناخ السودان | Geography: Sudan's Climate", objectives: "فهم المناطق المناخية | Understand climate zones in Sudan and Africa" },
  { title: "التجويد: أحكام النون الساكنة | Tajweed: Rules of Noon Sakinah", objectives: "إتقان أحكام التجويد | Master tajweed rules in Quran recitation" },
  { title: "السيرة النبوية: الهجرة | Seerah: The Migration", objectives: "دراسة هجرة النبي | Study the Prophet's migration to Medina" },
  { title: "التاريخ السوداني: مملكة كوش | Sudanese History: Kingdom of Kush", objectives: "فهم الحضارة الكوشية | Understand the ancient Kushite civilization" },
  { title: "الفقه: أركان الإسلام | Fiqh: Pillars of Islam", objectives: "تعلم أركان الإسلام | Learn the five pillars of Islam" },
  { title: "علوم الحاسوب: مقدمة في البرمجة | CS: Introduction to Programming", objectives: "تعلم أساسيات البرمجة | Learn programming fundamentals" },
];

export async function seedLessons(
  prisma: SeedPrisma,
  schoolId: string,
  classes: ClassRef[]
): Promise<void> {
  console.log("📖 Creating lesson plans (Comboni School - Bilingual)...");

  let count = 0;
  for (let i = 0; i < Math.min(16, classes.length * 2); i++) {
    const classObj = classes[i % classes.length];
    const topic = LESSON_TOPICS[i % LESSON_TOPICS.length];

    const lessonDate = new Date();
    lessonDate.setDate(lessonDate.getDate() + faker.number.int({ min: 1, max: 30 }));

    await prisma.lesson.create({
      data: {
        schoolId,
        classId: classObj.id,
        title: topic.title,
        description: `Comprehensive lesson on ${topic.title}`,
        lessonDate,
        startTime: "09:00",
        endTime: "10:00",
        objectives: topic.objectives,
        materials: "Textbook, whiteboard, projector",
        activities: "Lecture, Group discussion, Practice exercises",
        assessment: "Quiz, homework assignment",
        status: i < 5 ? "COMPLETED" : i < 10 ? "IN_PROGRESS" : "PLANNED",
      },
    });
    count++;
  }

  console.log(`   ✅ Created: ${count} lesson plans\n`);
}
