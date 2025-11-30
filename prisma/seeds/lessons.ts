/**
 * Lessons Seed Module
 * Creates lesson plans
 */

import { faker } from "@faker-js/faker";
import type { SeedPrisma, ClassRef } from "./types";

const LESSON_TOPICS = [
  { title: "Introduction to Algebra", objectives: "Understand basic algebraic concepts" },
  { title: "Arabic Grammar: Verb Conjugation", objectives: "Master verb conjugation" },
  { title: "English Literature: Poetry Analysis", objectives: "Analyze poetic devices" },
  { title: "Physics: Newton's Laws", objectives: "Apply Newton's laws" },
  { title: "Chemistry: Periodic Table", objectives: "Understand periodic trends" },
  { title: "Biology: Cell Structure", objectives: "Identify cell organelles" },
  { title: "Geography: Climate Zones", objectives: "Understand global climate patterns" },
  { title: "Islamic Studies: Quran Recitation", objectives: "Improve tajweed" },
];

export async function seedLessons(
  prisma: SeedPrisma,
  schoolId: string,
  classes: ClassRef[]
): Promise<void> {
  console.log("📖 Creating lesson plans...");

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
