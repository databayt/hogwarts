import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedStreamCoursesOnly() {
  console.log("🚀 Seeding ONLY Stream courses for Port Sudan...\n");

  // Get Port Sudan school
  const school = await prisma.school.findFirst({
    where: {
      OR: [
        { name: { contains: "Port Sudan" } },
        { domain: "portsudan" },
      ],
    },
  });

  if (!school) {
    console.error("❌ Port Sudan school not found!");
    return;
  }

  console.log(`✅ Found school: ${school.name} (${school.id})\n`);

  // Get teachers
  const teachers = await prisma.teacher.findMany({
    where: { schoolId: school.id },
    select: { id: true, name: true },
    take: 5,
  });

  console.log(`✅ Found ${teachers.length} teachers\n`);

  // Create categories
  const categories = [
    { name: "Programming", schoolId: school.id },
    { name: "Mathematics", schoolId: school.id },
    { name: "Science", schoolId: school.id },
    { name: "Languages", schoolId: school.id },
    { name: "Business", schoolId: school.id },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const existing = await prisma.streamCategory.findFirst({
      where: { name: cat.name, schoolId: school.id },
    });
    if (!existing) {
      const created = await prisma.streamCategory.create({ data: cat });
      createdCategories.push(created);
      console.log(`  ✅ Created category: ${created.name}`);
    } else {
      createdCategories.push(existing);
      console.log(`  ℹ️  Category already exists: ${existing.name}`);
    }
  }

  console.log("");

  // Sample courses
  const coursesData = [
    {
      title: "Introduction to Python Programming",
      slug: "intro-python-programming",
      description:
        "Learn Python from scratch with hands-on projects and real-world examples. Perfect for beginners!",
      price: 49.99,
      categoryId: createdCategories[0]?.id,
      imageUrl:
        "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=450&fit=crop",
      isPublished: true,
      chapters: [
        {
          title: "Getting Started with Python",
          description:
            "Introduction to Python and setting up your development environment",
          position: 1,
          isPublished: true,
          lessons: [
            {
              title: "What is Python?",
              position: 1,
              duration: 15,
              isPublished: true,
              isFree: true,
            },
            {
              title: "Installing Python",
              position: 2,
              duration: 20,
              isPublished: true,
              isFree: true,
            },
            {
              title: "Your First Program",
              position: 3,
              duration: 25,
              isPublished: true,
              isFree: false,
            },
          ],
        },
        {
          title: "Python Basics",
          description: "Learn variables, data types, and basic operations",
          position: 2,
          isPublished: true,
          lessons: [
            {
              title: "Variables and Data Types",
              position: 1,
              duration: 30,
              isPublished: true,
              isFree: false,
            },
            {
              title: "Operators and Expressions",
              position: 2,
              duration: 25,
              isPublished: true,
              isFree: false,
            },
            {
              title: "Control Flow",
              position: 3,
              duration: 35,
              isPublished: true,
              isFree: false,
            },
          ],
        },
        {
          title: "Functions and Modules",
          description: "Master functions, modules, and code organization",
          position: 3,
          isPublished: true,
          lessons: [
            {
              title: "Defining Functions",
              position: 1,
              duration: 30,
              isPublished: true,
              isFree: false,
            },
            {
              title: "Working with Modules",
              position: 2,
              duration: 25,
              isPublished: true,
              isFree: false,
            },
          ],
        },
      ],
    },
    {
      title: "Advanced Mathematics for Engineers",
      slug: "advanced-math-engineers",
      description:
        "Master calculus, linear algebra, and differential equations essential for engineering.",
      price: 79.99,
      categoryId: createdCategories[1]?.id,
      imageUrl:
        "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=450&fit=crop",
      isPublished: true,
      chapters: [
        {
          title: "Calculus Fundamentals",
          description: "Limits, derivatives, and integrals",
          position: 1,
          isPublished: true,
          lessons: [
            {
              title: "Limits and Continuity",
              position: 1,
              duration: 40,
              isPublished: true,
              isFree: true,
            },
            {
              title: "Derivatives",
              position: 2,
              duration: 45,
              isPublished: true,
              isFree: false,
            },
            {
              title: "Integration",
              position: 3,
              duration: 50,
              isPublished: true,
              isFree: false,
            },
          ],
        },
        {
          title: "Linear Algebra",
          description: "Matrices, vectors, and transformations",
          position: 2,
          isPublished: true,
          lessons: [
            {
              title: "Matrices and Vectors",
              position: 1,
              duration: 35,
              isPublished: true,
              isFree: false,
            },
            {
              title: "Linear Transformations",
              position: 2,
              duration: 40,
              isPublished: true,
              isFree: false,
            },
          ],
        },
      ],
    },
    {
      title: "Physics: Mechanics and Motion",
      slug: "physics-mechanics-motion",
      description:
        "Explore classical mechanics, forces, energy, and motion with interactive simulations.",
      price: 59.99,
      categoryId: createdCategories[2]?.id,
      imageUrl:
        "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&h=450&fit=crop",
      isPublished: true,
      chapters: [
        {
          title: "Newton's Laws of Motion",
          description: "Understanding forces and motion",
          position: 1,
          isPublished: true,
          lessons: [
            {
              title: "First Law: Inertia",
              position: 1,
              duration: 25,
              isPublished: true,
              isFree: true,
            },
            {
              title: "Second Law: F=ma",
              position: 2,
              duration: 30,
              isPublished: true,
              isFree: false,
            },
            {
              title: "Third Law: Action-Reaction",
              position: 3,
              duration: 25,
              isPublished: true,
              isFree: false,
            },
          ],
        },
        {
          title: "Energy and Work",
          description: "Kinetic energy, potential energy, and conservation",
          position: 2,
          isPublished: true,
          lessons: [
            {
              title: "Work and Power",
              position: 1,
              duration: 30,
              isPublished: true,
              isFree: false,
            },
            {
              title: "Conservation of Energy",
              position: 2,
              duration: 35,
              isPublished: true,
              isFree: false,
            },
          ],
        },
      ],
    },
    {
      title: "English Language Mastery",
      slug: "english-language-mastery",
      description:
        "Improve your English skills with grammar, vocabulary, and conversation practice.",
      price: 0, // Free course
      categoryId: createdCategories[3]?.id,
      imageUrl:
        "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=450&fit=crop",
      isPublished: true,
      chapters: [
        {
          title: "Grammar Essentials",
          description: "Master English grammar rules",
          position: 1,
          isPublished: true,
          lessons: [
            {
              title: "Tenses Overview",
              position: 1,
              duration: 20,
              isPublished: true,
              isFree: true,
            },
            {
              title: "Present Tenses",
              position: 2,
              duration: 25,
              isPublished: true,
              isFree: true,
            },
            {
              title: "Past Tenses",
              position: 3,
              duration: 25,
              isPublished: true,
              isFree: true,
            },
          ],
        },
        {
          title: "Vocabulary Building",
          description: "Expand your English vocabulary",
          position: 2,
          isPublished: true,
          lessons: [
            {
              title: "Common Phrases",
              position: 1,
              duration: 20,
              isPublished: true,
              isFree: true,
            },
            {
              title: "Academic Vocabulary",
              position: 2,
              duration: 30,
              isPublished: true,
              isFree: true,
            },
          ],
        },
      ],
    },
    {
      title: "Business Management Fundamentals",
      slug: "business-management-fundamentals",
      description:
        "Learn the core principles of business management, leadership, and strategy.",
      price: 69.99,
      categoryId: createdCategories[4]?.id,
      imageUrl:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop",
      isPublished: true,
      chapters: [
        {
          title: "Introduction to Management",
          description: "Basic management concepts and principles",
          position: 1,
          isPublished: true,
          lessons: [
            {
              title: "What is Management?",
              position: 1,
              duration: 30,
              isPublished: true,
              isFree: true,
            },
            {
              title: "Management Functions",
              position: 2,
              duration: 35,
              isPublished: true,
              isFree: false,
            },
          ],
        },
      ],
    },
  ];

  // Create courses
  for (const courseData of coursesData) {
    const { chapters, ...courseInfo } = courseData;

    // Check if course exists
    const existingCourse = await prisma.streamCourse.findFirst({
      where: { slug: courseInfo.slug, schoolId: school.id },
    });

    if (existingCourse) {
      console.log(`  ℹ️  Course "${courseInfo.title}" already exists, skipping...`);
      continue;
    }

    // Create course
    const course = await prisma.streamCourse.create({
      data: {
        ...courseInfo,
        schoolId: school.id,
        userId: teachers[0]?.id || "system",
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

      console.log(
        `    ✅ Chapter: ${chapter.title} (${lessons.length} lessons)`
      );
    }
  }

  console.log("\n✅ Stream courses seeded successfully!");
  console.log(
    "\n🌐 View at: https://portsudan.databayt.org/en/stream/courses\n"
  );
}

seedStreamCoursesOnly()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
