/**
 * Stream (LMS) Seed Module
 * Creates LMS courses, chapters, and lessons
 */

import { faker } from "@faker-js/faker";
import type { SeedPrisma, TeacherRef } from "./types";

const COURSES_DATA = [
  {
    title: "Introduction to Python Programming",
    slug: "intro-python-programming",
    description: "Learn Python from scratch with hands-on projects.",
    price: 49.99,
    categoryName: "Programming",
    chapters: [
      { title: "Getting Started with Python", lessons: ["What is Python?", "Installing Python", "Your First Program"] },
      { title: "Python Basics", lessons: ["Variables", "Operators", "Control Flow"] },
    ],
  },
  {
    title: "Advanced Mathematics",
    slug: "advanced-mathematics",
    description: "Master calculus, linear algebra, and differential equations.",
    price: 79.99,
    categoryName: "Mathematics",
    chapters: [
      { title: "Calculus Fundamentals", lessons: ["Limits", "Derivatives", "Integration"] },
      { title: "Linear Algebra", lessons: ["Matrices", "Vectors", "Transformations"] },
    ],
  },
  {
    title: "Physics: Mechanics",
    slug: "physics-mechanics",
    description: "Explore classical mechanics, forces, and motion.",
    price: 59.99,
    categoryName: "Science",
    chapters: [
      { title: "Newton's Laws", lessons: ["First Law", "Second Law", "Third Law"] },
      { title: "Energy and Work", lessons: ["Work", "Energy Conservation"] },
    ],
  },
  {
    title: "English Language Mastery",
    slug: "english-language-mastery",
    description: "Improve your English skills.",
    price: 0,
    categoryName: "Languages",
    chapters: [
      { title: "Grammar Essentials", lessons: ["Tenses", "Present Tense", "Past Tense"] },
      { title: "Vocabulary Building", lessons: ["Common Phrases", "Academic Vocabulary"] },
    ],
  },
];

export async function seedStream(
  prisma: SeedPrisma,
  schoolId: string,
  teachers: TeacherRef[]
): Promise<void> {
  console.log("🎓 Creating LMS courses...");

  // Categories
  const categoryNames = ["Programming", "Mathematics", "Science", "Languages", "Business"];
  const categories = new Map<string, string>();

  for (const name of categoryNames) {
    const cat = await prisma.streamCategory.create({ data: { name, schoolId } });
    categories.set(name, cat.id);
  }

  // Courses
  let courseCount = 0;
  for (const courseData of COURSES_DATA) {
    const { chapters, categoryName, ...courseInfo } = courseData;

    const course = await prisma.streamCourse.create({
      data: {
        ...courseInfo,
        schoolId,
        userId: teachers[0]?.userId,
        categoryId: categories.get(categoryName),
        isPublished: true,
        imageUrl: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=450&fit=crop",
      },
    });

    // Chapters and lessons
    for (let ci = 0; ci < chapters.length; ci++) {
      const chapter = await prisma.streamChapter.create({
        data: {
          title: chapters[ci].title,
          description: `Chapter ${ci + 1}`,
          position: ci + 1,
          isPublished: true,
          courseId: course.id,
        },
      });

      for (let li = 0; li < chapters[ci].lessons.length; li++) {
        await prisma.streamLesson.create({
          data: {
            title: chapters[ci].lessons[li],
            position: li + 1,
            duration: faker.number.int({ min: 15, max: 45 }),
            isPublished: true,
            isFree: li === 0,
            chapterId: chapter.id,
          },
        });
      }
    }

    courseCount++;
  }

  console.log(`   ✅ Created: ${courseCount} LMS courses with chapters and lessons\n`);
}
