import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// High-quality course images from Unsplash
const courseImages = {
  python: "https://images.unsplash.com/photo-1649180556628-9ba704115795?w=800&h=450&fit=crop&q=80",
  javascript: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=450&fit=crop&q=80",
  webDev: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop&q=80",
  ai: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop&q=80",
  dataScience: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&q=80",
  math: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=450&fit=crop&q=80",
  physics: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&h=450&fit=crop&q=80",
  chemistry: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=450&fit=crop&q=80",
  biology: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=450&fit=crop&q=80",
  english: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&h=450&fit=crop&q=80",
  arabic: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=450&fit=crop&q=80",
  business: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop&q=80",
  marketing: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=450&fit=crop&q=80",
  design: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop&q=80",
  mobile: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=450&fit=crop&q=80",
  cloud: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&h=450&fit=crop&q=80",
};

// Category translations
const categoriesData = {
  en: [
    { name: "Technology" },
    { name: "Mathematics" },
    { name: "Science" },
    { name: "Languages" },
    { name: "Business" },
    { name: "AI" },
  ],
  ar: [
    { name: "التقنية" },
    { name: "الرياضيات" },
    { name: "العلوم" },
    { name: "اللغات" },
    { name: "الأعمال" },
    { name: "الذكاء الاصطناعي" },
  ],
};

async function seedStreamCoursesOnly() {
  console.log("🚀 Seeding Stream courses (EN & AR)...\n");

  // Get the first available school (Demo School or any other)
  const school = await prisma.school.findFirst({
    where: {
      OR: [
        { domain: "demo" },
        { name: { contains: "Demo" } },
        { domain: "portsudan" },
        { name: { contains: "Port Sudan" } },
      ],
    },
  });

  if (!school) {
    console.error("❌ No school found! Please seed schools first.");
    return;
  }

  console.log(`✅ Found school: ${school.name} (${school.id})\n`);

  // Get a user from the school to be the course creator
  const schoolUser = await prisma.user.findFirst({
    where: { schoolId: school.id },
    select: { id: true },
  });

  if (!schoolUser) {
    console.error("❌ No user found for the school!");
    return;
  }

  console.log(`✅ Found school user: ${schoolUser.id}\n`);

  // Create categories for both languages
  const createdCategories: Record<string, { id: string; name: string; lang: string }[]> = { en: [], ar: [] };

  for (const lang of ["en", "ar"] as const) {
    console.log(`\n📂 Creating ${lang.toUpperCase()} categories...`);
    for (const cat of categoriesData[lang]) {
      const existing = await prisma.streamCategory.findFirst({
        where: { name: cat.name, schoolId: school.id, lang },
      });
      if (!existing) {
        const created = await prisma.streamCategory.create({
          data: { ...cat, schoolId: school.id, lang },
        });
        createdCategories[lang].push(created);
        console.log(`  ✅ Created category: ${created.name}`);
      } else {
        createdCategories[lang].push(existing);
        console.log(`  ℹ️  Category already exists: ${existing.name}`);
      }
    }
  }

  console.log("");

  // Bilingual courses data
  const coursesData = {
    en: [
      {
        title: "Introduction to Python Programming",
        slug: "intro-python-programming",
        description: "Learn Python from scratch with hands-on projects and real-world examples. Perfect for beginners who want to master one of the most popular programming languages.",
        price: 49.99,
        categoryIndex: 0, // Technology
        imageUrl: courseImages.python,
        isPublished: true,
        level: "BEGINNER" as const,
        status: "PUBLISHED" as const,
        chapters: [
          {
            title: "Getting Started with Python",
            description: "Introduction to Python and setting up your development environment",
            position: 1,
            isPublished: true,
            lessons: [
              { title: "What is Python?", position: 1, duration: 15, isPublished: true, isFree: true },
              { title: "Installing Python", position: 2, duration: 20, isPublished: true, isFree: true },
              { title: "Your First Program", position: 3, duration: 25, isPublished: true, isFree: false },
            ],
          },
          {
            title: "Python Basics",
            description: "Learn variables, data types, and basic operations",
            position: 2,
            isPublished: true,
            lessons: [
              { title: "Variables and Data Types", position: 1, duration: 30, isPublished: true, isFree: false },
              { title: "Operators and Expressions", position: 2, duration: 25, isPublished: true, isFree: false },
              { title: "Control Flow", position: 3, duration: 35, isPublished: true, isFree: false },
            ],
          },
          {
            title: "Functions and Modules",
            description: "Master functions, modules, and code organization",
            position: 3,
            isPublished: true,
            lessons: [
              { title: "Defining Functions", position: 1, duration: 30, isPublished: true, isFree: false },
              { title: "Working with Modules", position: 2, duration: 25, isPublished: true, isFree: false },
            ],
          },
        ],
      },
      {
        title: "Modern Web Development with JavaScript",
        slug: "modern-web-development-javascript",
        description: "Master modern JavaScript and build interactive web applications. Learn ES6+, DOM manipulation, and async programming.",
        price: 69.99,
        categoryIndex: 0, // Technology
        imageUrl: courseImages.javascript,
        isPublished: true,
        level: "INTERMEDIATE" as const,
        status: "PUBLISHED" as const,
        chapters: [
          {
            title: "JavaScript Fundamentals",
            description: "Core JavaScript concepts every developer needs",
            position: 1,
            isPublished: true,
            lessons: [
              { title: "Variables and Scope", position: 1, duration: 25, isPublished: true, isFree: true },
              { title: "Functions and Closures", position: 2, duration: 30, isPublished: true, isFree: false },
              { title: "Objects and Arrays", position: 3, duration: 35, isPublished: true, isFree: false },
            ],
          },
          {
            title: "DOM Manipulation",
            description: "Interact with web pages dynamically",
            position: 2,
            isPublished: true,
            lessons: [
              { title: "Selecting Elements", position: 1, duration: 20, isPublished: true, isFree: false },
              { title: "Event Handling", position: 2, duration: 30, isPublished: true, isFree: false },
            ],
          },
        ],
      },
      {
        title: "Introduction to Artificial Intelligence",
        slug: "intro-artificial-intelligence",
        description: "Discover the fascinating world of AI and machine learning. Learn fundamental concepts and practical applications.",
        price: 89.99,
        categoryIndex: 5, // AI
        imageUrl: courseImages.ai,
        isPublished: true,
        level: "BEGINNER" as const,
        status: "PUBLISHED" as const,
        chapters: [
          {
            title: "What is AI?",
            description: "Understanding artificial intelligence concepts",
            position: 1,
            isPublished: true,
            lessons: [
              { title: "History of AI", position: 1, duration: 20, isPublished: true, isFree: true },
              { title: "Types of AI", position: 2, duration: 25, isPublished: true, isFree: true },
              { title: "AI Applications", position: 3, duration: 30, isPublished: true, isFree: false },
            ],
          },
          {
            title: "Machine Learning Basics",
            description: "Introduction to ML algorithms",
            position: 2,
            isPublished: true,
            lessons: [
              { title: "Supervised Learning", position: 1, duration: 35, isPublished: true, isFree: false },
              { title: "Unsupervised Learning", position: 2, duration: 30, isPublished: true, isFree: false },
            ],
          },
        ],
      },
      {
        title: "Advanced Mathematics for Engineers",
        slug: "advanced-math-engineers",
        description: "Master calculus, linear algebra, and differential equations essential for engineering and scientific computing.",
        price: 79.99,
        categoryIndex: 1, // Mathematics
        imageUrl: courseImages.math,
        isPublished: true,
        level: "ADVANCED" as const,
        status: "PUBLISHED" as const,
        chapters: [
          {
            title: "Calculus Fundamentals",
            description: "Limits, derivatives, and integrals",
            position: 1,
            isPublished: true,
            lessons: [
              { title: "Limits and Continuity", position: 1, duration: 40, isPublished: true, isFree: true },
              { title: "Derivatives", position: 2, duration: 45, isPublished: true, isFree: false },
              { title: "Integration", position: 3, duration: 50, isPublished: true, isFree: false },
            ],
          },
          {
            title: "Linear Algebra",
            description: "Matrices, vectors, and transformations",
            position: 2,
            isPublished: true,
            lessons: [
              { title: "Matrices and Vectors", position: 1, duration: 35, isPublished: true, isFree: false },
              { title: "Linear Transformations", position: 2, duration: 40, isPublished: true, isFree: false },
            ],
          },
        ],
      },
      {
        title: "Physics: Mechanics and Motion",
        slug: "physics-mechanics-motion",
        description: "Explore classical mechanics, forces, energy, and motion with interactive examples and problem solving.",
        price: 59.99,
        categoryIndex: 2, // Science
        imageUrl: courseImages.physics,
        isPublished: true,
        level: "INTERMEDIATE" as const,
        status: "PUBLISHED" as const,
        chapters: [
          {
            title: "Newton's Laws of Motion",
            description: "Understanding forces and motion",
            position: 1,
            isPublished: true,
            lessons: [
              { title: "First Law: Inertia", position: 1, duration: 25, isPublished: true, isFree: true },
              { title: "Second Law: F=ma", position: 2, duration: 30, isPublished: true, isFree: false },
              { title: "Third Law: Action-Reaction", position: 3, duration: 25, isPublished: true, isFree: false },
            ],
          },
          {
            title: "Energy and Work",
            description: "Kinetic energy, potential energy, and conservation",
            position: 2,
            isPublished: true,
            lessons: [
              { title: "Work and Power", position: 1, duration: 30, isPublished: true, isFree: false },
              { title: "Conservation of Energy", position: 2, duration: 35, isPublished: true, isFree: false },
            ],
          },
        ],
      },
      {
        title: "Business Strategy and Leadership",
        slug: "business-strategy-leadership",
        description: "Learn the core principles of business management, strategic planning, and effective leadership.",
        price: 69.99,
        categoryIndex: 4, // Business
        imageUrl: courseImages.business,
        isPublished: true,
        level: "INTERMEDIATE" as const,
        status: "PUBLISHED" as const,
        chapters: [
          {
            title: "Strategic Management",
            description: "Planning and executing business strategies",
            position: 1,
            isPublished: true,
            lessons: [
              { title: "What is Strategy?", position: 1, duration: 30, isPublished: true, isFree: true },
              { title: "SWOT Analysis", position: 2, duration: 35, isPublished: true, isFree: false },
            ],
          },
        ],
      },
    ],
    ar: [
      {
        title: "مقدمة في برمجة بايثون",
        slug: "intro-python-programming",
        description: "تعلم لغة بايثون من الصفر مع مشاريع عملية وأمثلة من العالم الحقيقي. مثالي للمبتدئين الذين يريدون إتقان واحدة من أكثر لغات البرمجة شيوعاً.",
        price: 49.99,
        categoryIndex: 0, // التقنية
        imageUrl: courseImages.python,
        isPublished: true,
        level: "BEGINNER" as const,
        status: "PUBLISHED" as const,
        chapters: [
          {
            title: "البداية مع بايثون",
            description: "مقدمة في بايثون وإعداد بيئة التطوير",
            position: 1,
            isPublished: true,
            lessons: [
              { title: "ما هي بايثون؟", position: 1, duration: 15, isPublished: true, isFree: true },
              { title: "تثبيت بايثون", position: 2, duration: 20, isPublished: true, isFree: true },
              { title: "برنامجك الأول", position: 3, duration: 25, isPublished: true, isFree: false },
            ],
          },
          {
            title: "أساسيات بايثون",
            description: "تعلم المتغيرات وأنواع البيانات والعمليات الأساسية",
            position: 2,
            isPublished: true,
            lessons: [
              { title: "المتغيرات وأنواع البيانات", position: 1, duration: 30, isPublished: true, isFree: false },
              { title: "العمليات والتعبيرات", position: 2, duration: 25, isPublished: true, isFree: false },
              { title: "التحكم في التدفق", position: 3, duration: 35, isPublished: true, isFree: false },
            ],
          },
          {
            title: "الدوال والوحدات",
            description: "إتقان الدوال والوحدات وتنظيم الكود",
            position: 3,
            isPublished: true,
            lessons: [
              { title: "تعريف الدوال", position: 1, duration: 30, isPublished: true, isFree: false },
              { title: "العمل مع الوحدات", position: 2, duration: 25, isPublished: true, isFree: false },
            ],
          },
        ],
      },
      {
        title: "تطوير الويب الحديث مع جافاسكريبت",
        slug: "modern-web-development-javascript",
        description: "أتقن جافاسكريبت الحديثة وقم ببناء تطبيقات ويب تفاعلية. تعلم ES6+ والتعامل مع DOM والبرمجة غير المتزامنة.",
        price: 69.99,
        categoryIndex: 0, // التقنية
        imageUrl: courseImages.javascript,
        isPublished: true,
        level: "INTERMEDIATE" as const,
        status: "PUBLISHED" as const,
        chapters: [
          {
            title: "أساسيات جافاسكريبت",
            description: "مفاهيم جافاسكريبت الأساسية التي يحتاجها كل مطور",
            position: 1,
            isPublished: true,
            lessons: [
              { title: "المتغيرات والنطاق", position: 1, duration: 25, isPublished: true, isFree: true },
              { title: "الدوال والإغلاق", position: 2, duration: 30, isPublished: true, isFree: false },
              { title: "الكائنات والمصفوفات", position: 3, duration: 35, isPublished: true, isFree: false },
            ],
          },
          {
            title: "التعامل مع DOM",
            description: "التفاعل مع صفحات الويب ديناميكياً",
            position: 2,
            isPublished: true,
            lessons: [
              { title: "تحديد العناصر", position: 1, duration: 20, isPublished: true, isFree: false },
              { title: "معالجة الأحداث", position: 2, duration: 30, isPublished: true, isFree: false },
            ],
          },
        ],
      },
      {
        title: "مقدمة في الذكاء الاصطناعي",
        slug: "intro-artificial-intelligence",
        description: "اكتشف عالم الذكاء الاصطناعي الرائع وتعلم الآلة. تعلم المفاهيم الأساسية والتطبيقات العملية.",
        price: 89.99,
        categoryIndex: 5, // الذكاء الاصطناعي
        imageUrl: courseImages.ai,
        isPublished: true,
        level: "BEGINNER" as const,
        status: "PUBLISHED" as const,
        chapters: [
          {
            title: "ما هو الذكاء الاصطناعي؟",
            description: "فهم مفاهيم الذكاء الاصطناعي",
            position: 1,
            isPublished: true,
            lessons: [
              { title: "تاريخ الذكاء الاصطناعي", position: 1, duration: 20, isPublished: true, isFree: true },
              { title: "أنواع الذكاء الاصطناعي", position: 2, duration: 25, isPublished: true, isFree: true },
              { title: "تطبيقات الذكاء الاصطناعي", position: 3, duration: 30, isPublished: true, isFree: false },
            ],
          },
          {
            title: "أساسيات تعلم الآلة",
            description: "مقدمة في خوارزميات تعلم الآلة",
            position: 2,
            isPublished: true,
            lessons: [
              { title: "التعلم الموجه", position: 1, duration: 35, isPublished: true, isFree: false },
              { title: "التعلم غير الموجه", position: 2, duration: 30, isPublished: true, isFree: false },
            ],
          },
        ],
      },
      {
        title: "الرياضيات المتقدمة للمهندسين",
        slug: "advanced-math-engineers",
        description: "أتقن التفاضل والتكامل والجبر الخطي والمعادلات التفاضلية الضرورية للهندسة والحوسبة العلمية.",
        price: 79.99,
        categoryIndex: 1, // الرياضيات
        imageUrl: courseImages.math,
        isPublished: true,
        level: "ADVANCED" as const,
        status: "PUBLISHED" as const,
        chapters: [
          {
            title: "أساسيات التفاضل والتكامل",
            description: "النهايات والمشتقات والتكاملات",
            position: 1,
            isPublished: true,
            lessons: [
              { title: "النهايات والاتصال", position: 1, duration: 40, isPublished: true, isFree: true },
              { title: "المشتقات", position: 2, duration: 45, isPublished: true, isFree: false },
              { title: "التكامل", position: 3, duration: 50, isPublished: true, isFree: false },
            ],
          },
          {
            title: "الجبر الخطي",
            description: "المصفوفات والمتجهات والتحويلات",
            position: 2,
            isPublished: true,
            lessons: [
              { title: "المصفوفات والمتجهات", position: 1, duration: 35, isPublished: true, isFree: false },
              { title: "التحويلات الخطية", position: 2, duration: 40, isPublished: true, isFree: false },
            ],
          },
        ],
      },
      {
        title: "الفيزياء: الميكانيكا والحركة",
        slug: "physics-mechanics-motion",
        description: "استكشف الميكانيكا الكلاسيكية والقوى والطاقة والحركة مع أمثلة تفاعلية وحل المسائل.",
        price: 59.99,
        categoryIndex: 2, // العلوم
        imageUrl: courseImages.physics,
        isPublished: true,
        level: "INTERMEDIATE" as const,
        status: "PUBLISHED" as const,
        chapters: [
          {
            title: "قوانين نيوتن للحركة",
            description: "فهم القوى والحركة",
            position: 1,
            isPublished: true,
            lessons: [
              { title: "القانون الأول: القصور الذاتي", position: 1, duration: 25, isPublished: true, isFree: true },
              { title: "القانون الثاني: F=ma", position: 2, duration: 30, isPublished: true, isFree: false },
              { title: "القانون الثالث: الفعل ورد الفعل", position: 3, duration: 25, isPublished: true, isFree: false },
            ],
          },
          {
            title: "الطاقة والشغل",
            description: "الطاقة الحركية والطاقة الكامنة والحفظ",
            position: 2,
            isPublished: true,
            lessons: [
              { title: "الشغل والقدرة", position: 1, duration: 30, isPublished: true, isFree: false },
              { title: "حفظ الطاقة", position: 2, duration: 35, isPublished: true, isFree: false },
            ],
          },
        ],
      },
      {
        title: "استراتيجية الأعمال والقيادة",
        slug: "business-strategy-leadership",
        description: "تعلم المبادئ الأساسية لإدارة الأعمال والتخطيط الاستراتيجي والقيادة الفعالة.",
        price: 69.99,
        categoryIndex: 4, // الأعمال
        imageUrl: courseImages.business,
        isPublished: true,
        level: "INTERMEDIATE" as const,
        status: "PUBLISHED" as const,
        chapters: [
          {
            title: "الإدارة الاستراتيجية",
            description: "تخطيط وتنفيذ استراتيجيات الأعمال",
            position: 1,
            isPublished: true,
            lessons: [
              { title: "ما هي الاستراتيجية؟", position: 1, duration: 30, isPublished: true, isFree: true },
              { title: "تحليل SWOT", position: 2, duration: 35, isPublished: true, isFree: false },
            ],
          },
        ],
      },
    ],
  };

  // Create courses for both languages
  for (const lang of ["en", "ar"] as const) {
    console.log(`\n📚 Creating ${lang.toUpperCase()} courses...`);

    for (const courseData of coursesData[lang]) {
      const { chapters, categoryIndex, ...courseInfo } = courseData;

      // Check if course exists
      const existingCourse = await prisma.streamCourse.findFirst({
        where: { slug: courseInfo.slug, schoolId: school.id, lang },
      });

      if (existingCourse) {
        console.log(`  ℹ️  Course "${courseInfo.title}" already exists, skipping...`);
        continue;
      }

      // Create course
      const course = await prisma.streamCourse.create({
        data: {
          ...courseInfo,
          lang,
          categoryId: createdCategories[lang][categoryIndex]?.id,
          schoolId: school.id,
          userId: schoolUser.id,
        },
      });

      console.log(`  ✅ Created course: ${course.title} ($${course.price})`);

      // Create chapters and lessons
      for (const chapterData of chapters) {
        const { lessons, ...chapterInfo } = chapterData;

        const chapter = await prisma.streamChapter.create({
          data: {
            ...chapterInfo,
            courseId: course.id,
          },
        });

        // Create lessons
        for (const lessonData of lessons) {
          await prisma.streamLesson.create({
            data: {
              ...lessonData,
              chapterId: chapter.id,
            },
          });
        }

        console.log(`    ✅ Chapter: ${chapter.title} (${lessons.length} lessons)`);
      }
    }
  }

  console.log("\n✅ Stream courses seeded successfully!");
  console.log("\n🌐 View at:");
  console.log(`  English: https://${school.domain}.databayt.org/en/stream/courses`);
  console.log(`  Arabic:  https://${school.domain}.databayt.org/ar/stream/courses`);
  console.log(`  Local:   http://${school.domain}.localhost:3000/en/stream/courses\n`);
}

seedStreamCoursesOnly()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
