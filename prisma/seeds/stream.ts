/**
 * Stream (LMS) Seed Module
 * Creates LMS courses, chapters, and lessons
 * Comboni School - Arabic, Islamic, and Academic courses
 */

import { faker } from "@faker-js/faker";
import type { SeedPrisma, TeacherRef } from "./types";

const COURSES_DATA = [
  // Islamic Studies
  {
    title: "القرآن الكريم - التجويد | Quran Recitation with Tajweed",
    slug: "quran-tajweed",
    description: "تعلم أحكام التجويد وتلاوة القرآن الكريم بالطريقة الصحيحة. Learn proper Quran recitation with tajweed rules.",
    price: 0,
    categoryName: "Islamic Studies",
    chapters: [
      { title: "مقدمة في التجويد | Introduction to Tajweed", lessons: ["أهمية التجويد | Importance of Tajweed", "مخارج الحروف | Letter Articulation Points", "صفات الحروف | Letter Characteristics"] },
      { title: "أحكام النون الساكنة | Rules of Noon Sakinah", lessons: ["الإظهار | Izhar", "الإدغام | Idgham", "الإقلاب | Iqlab", "الإخفاء | Ikhfa"] },
    ],
  },
  {
    title: "السيرة النبوية | Life of Prophet Muhammad ﷺ",
    slug: "seerah-nabawiyyah",
    description: "دراسة سيرة النبي محمد صلى الله عليه وسلم من الميلاد إلى الوفاة. Comprehensive study of the Prophet's life.",
    price: 0,
    categoryName: "Islamic Studies",
    chapters: [
      { title: "الفترة المكية | Meccan Period", lessons: ["الميلاد والنشأة | Birth and Childhood", "البعثة | The Revelation", "الدعوة السرية والجهرية | Secret and Public Call"] },
      { title: "الفترة المدنية | Medinan Period", lessons: ["الهجرة | The Migration", "غزوات النبي | Battles", "فتح مكة | Conquest of Mecca"] },
    ],
  },
  // Arabic Language
  {
    title: "النحو العربي | Arabic Grammar",
    slug: "arabic-grammar",
    description: "أساسيات النحو العربي للمبتدئين والمتوسطين. Arabic grammar fundamentals for beginners and intermediate learners.",
    price: 0,
    categoryName: "Languages",
    chapters: [
      { title: "الجملة الاسمية | Nominal Sentence", lessons: ["المبتدأ والخبر | Subject and Predicate", "أنواع الخبر | Types of Predicate", "كان وأخواتها | Kana and Sisters"] },
      { title: "الجملة الفعلية | Verbal Sentence", lessons: ["الفعل والفاعل | Verb and Subject", "المفعول به | Object", "الفعل المبني للمجهول | Passive Voice"] },
    ],
  },
  // Mathematics
  {
    title: "الرياضيات المتقدمة | Advanced Mathematics",
    slug: "advanced-mathematics",
    description: "التفاضل والتكامل والجبر الخطي. Calculus, linear algebra, and differential equations.",
    price: 0,
    categoryName: "Mathematics",
    chapters: [
      { title: "التفاضل | Calculus", lessons: ["النهايات | Limits", "المشتقات | Derivatives", "التكامل | Integration"] },
      { title: "الجبر الخطي | Linear Algebra", lessons: ["المصفوفات | Matrices", "المتجهات | Vectors", "التحويلات | Transformations"] },
    ],
  },
  // Science
  {
    title: "الفيزياء: الميكانيكا | Physics: Mechanics",
    slug: "physics-mechanics",
    description: "دراسة الميكانيكا الكلاسيكية والقوى والحركة. Classical mechanics, forces, and motion.",
    price: 0,
    categoryName: "Science",
    chapters: [
      { title: "قوانين نيوتن | Newton's Laws", lessons: ["القانون الأول | First Law", "القانون الثاني | Second Law", "القانون الثالث | Third Law"] },
      { title: "الطاقة والشغل | Energy and Work", lessons: ["الشغل | Work", "الطاقة الحركية | Kinetic Energy", "حفظ الطاقة | Energy Conservation"] },
    ],
  },
  // English Language
  {
    title: "English Language Mastery",
    slug: "english-language-mastery",
    description: "Comprehensive English skills for academic success.",
    price: 0,
    categoryName: "Languages",
    chapters: [
      { title: "Grammar Essentials", lessons: ["Tenses Overview", "Present & Past Tense", "Future & Conditional"] },
      { title: "Academic Writing", lessons: ["Essay Structure", "Research Writing", "Citations & References"] },
    ],
  },
  // Computer Science
  {
    title: "مقدمة في البرمجة | Introduction to Programming",
    slug: "intro-programming",
    description: "تعلم أساسيات البرمجة باستخدام بايثون. Learn programming fundamentals with Python.",
    price: 0,
    categoryName: "Programming",
    chapters: [
      { title: "البداية مع بايثون | Getting Started", lessons: ["ما هي البرمجة؟ | What is Programming?", "تثبيت بايثون | Installing Python", "برنامجك الأول | Your First Program"] },
      { title: "أساسيات بايثون | Python Basics", lessons: ["المتغيرات | Variables", "العمليات الحسابية | Operators", "التحكم بالتدفق | Control Flow"] },
    ],
  },
  // Sudanese Studies
  {
    title: "تاريخ السودان | Sudanese History",
    slug: "sudanese-history",
    description: "دراسة تاريخ السودان من الممالك القديمة إلى العصر الحديث. Sudan's history from ancient kingdoms to modern era.",
    price: 0,
    categoryName: "Humanities",
    chapters: [
      { title: "الممالك القديمة | Ancient Kingdoms", lessons: ["مملكة كوش | Kingdom of Kush", "نبتة ومروي | Napata and Meroe", "الممالك المسيحية | Christian Kingdoms"] },
      { title: "السودان الحديث | Modern Sudan", lessons: ["الدولة المهدية | Mahdist State", "الحكم الثنائي | Condominium Rule", "الاستقلال | Independence"] },
    ],
  },
];

export async function seedStream(
  prisma: SeedPrisma,
  schoolId: string,
  teachers: TeacherRef[]
): Promise<void> {
  console.log("🎓 Creating LMS courses (Comboni School - Arabic, Islamic & Academic)...");

  // Categories - Arabic/English
  const categoryNames = ["Islamic Studies", "Languages", "Mathematics", "Science", "Programming", "Humanities"];
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
