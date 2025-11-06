/*
  Simplified Question Bank Seed for Production Database
  - Uses only core fields that exist in production
  - No dependencies on new AI generation fields
*/

import {
  PrismaClient,
  QuestionType,
  DifficultyLevel,
  BloomLevel,
  QuestionSource
} from "@prisma/client";

const prisma = new PrismaClient();

async function seedQuestionBank() {
  console.log("🌱 Seeding Question Bank for Demo School...");

  // Get demo school using raw query to avoid schema issues
  const schools = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM schools WHERE domain = 'demo' LIMIT 1
  `;

  if (!schools || schools.length === 0) {
    console.error("❌ Demo school not found! Run the main seed first.");
    process.exit(1);
  }

  const schoolId = schools[0].id;

  // Get a teacher
  const teachers = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM teachers WHERE "schoolId" = ${schoolId} LIMIT 1
  `;

  if (!teachers || teachers.length === 0) {
    console.error("❌ No teacher found! Run the main seed first.");
    process.exit(1);
  }

  const teacherId = teachers[0].id;

  // Get subjects
  const subjects = await prisma.$queryRaw<Array<{ id: string; "subjectName": string }>>`
    SELECT id, "subjectName" FROM subjects WHERE "schoolId" = ${schoolId}
  `;

  const getSubject = (name: string) => subjects.find(s => s.subjectName === name);

  const mathSubject = getSubject("Mathematics");
  const physicsSubject = getSubject("Physics");
  const chemistrySubject = getSubject("Chemistry");
  const biologySubject = getSubject("Biology");
  const englishSubject = getSubject("English Language");
  const arabicSubject = getSubject("Arabic Language");
  const historySubject = getSubject("History");
  const geographySubject = getSubject("Geography");
  const csSubject = getSubject("Computer Science");

  if (!mathSubject || !physicsSubject || !chemistrySubject || !biologySubject ||
      !englishSubject || !arabicSubject || !historySubject || !geographySubject || !csSubject) {
    console.error("❌ Required subjects not found!");
    console.log("Available subjects:", subjects.map(s => s.subjectName));
    process.exit(1);
  }

  const questions = [
    // Mathematics Questions
    {
      subjectId: mathSubject.id,
      questionText: "What is 15 + 27?",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 2,
      options: JSON.stringify([
        { text: "42", isCorrect: true },
        { text: "32", isCorrect: false },
        { text: "52", isCorrect: false },
        { text: "40", isCorrect: false }
      ]),
      tags: ["arithmetic", "addition", "grade-7"],
      explanation: "15 + 27 = 42",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: mathSubject.id,
      questionText: "Solve for x: 2x + 5 = 15",
      questionType: QuestionType.SHORT_ANSWER,
      difficulty: DifficultyLevel.MEDIUM,
      bloomLevel: BloomLevel.APPLY,
      points: 3,
      timeEstimate: 5,
      sampleAnswer: "x = 5",
      tags: ["algebra", "equations", "grade-8"],
      explanation: "Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: mathSubject.id,
      questionText: "What is the derivative of f(x) = x² + 3x - 2?",
      questionType: QuestionType.SHORT_ANSWER,
      difficulty: DifficultyLevel.HARD,
      bloomLevel: BloomLevel.APPLY,
      points: 5,
      timeEstimate: 8,
      sampleAnswer: "f'(x) = 2x + 3",
      tags: ["calculus", "derivatives", "grade-12"],
      explanation: "Using power rule: d/dx(x²) = 2x, d/dx(3x) = 3, d/dx(-2) = 0",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: mathSubject.id,
      questionText: "The Pythagorean theorem applies only to right-angled triangles.",
      questionType: QuestionType.TRUE_FALSE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: JSON.stringify([
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false }
      ]),
      tags: ["geometry", "pythagorean", "grade-9"],
      explanation: "The Pythagorean theorem (a² + b² = c²) only applies to right-angled triangles.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: mathSubject.id,
      questionText: "Calculate the area of a circle with radius 7cm. (Use π ≈ 3.14)",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.MEDIUM,
      bloomLevel: BloomLevel.APPLY,
      points: 2,
      timeEstimate: 4,
      options: JSON.stringify([
        { text: "153.86 cm²", isCorrect: true },
        { text: "43.96 cm²", isCorrect: false },
        { text: "21.98 cm²", isCorrect: false },
        { text: "307.72 cm²", isCorrect: false }
      ]),
      tags: ["geometry", "circles", "area", "grade-8"],
      explanation: "Area = πr² = 3.14 × 7² = 3.14 × 49 = 153.86 cm²",
      source: QuestionSource.MANUAL
    },

    // Physics Questions
    {
      subjectId: physicsSubject.id,
      questionText: "What is Newton's First Law of Motion?",
      questionType: QuestionType.SHORT_ANSWER,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 2,
      timeEstimate: 3,
      sampleAnswer: "An object at rest stays at rest and an object in motion stays in motion with the same speed and direction unless acted upon by an unbalanced force.",
      tags: ["mechanics", "newton-laws", "grade-9"],
      explanation: "This is also known as the law of inertia.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: physicsSubject.id,
      questionText: "Calculate the force required to accelerate a 10kg object at 5m/s².",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.MEDIUM,
      bloomLevel: BloomLevel.APPLY,
      points: 3,
      timeEstimate: 5,
      options: JSON.stringify([
        { text: "50 N", isCorrect: true },
        { text: "15 N", isCorrect: false },
        { text: "2 N", isCorrect: false },
        { text: "0.5 N", isCorrect: false }
      ]),
      tags: ["mechanics", "force", "newton-second-law", "grade-10"],
      explanation: "Using F = ma: F = 10kg × 5m/s² = 50N",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: physicsSubject.id,
      questionText: "Light travels faster in water than in air.",
      questionType: QuestionType.TRUE_FALSE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: JSON.stringify([
        { text: "True", isCorrect: false },
        { text: "False", isCorrect: true }
      ]),
      tags: ["optics", "light", "grade-10"],
      explanation: "Light travels slower in water (refractive index ~1.33) than in air (refractive index ~1.00).",
      source: QuestionSource.MANUAL
    },

    // Chemistry Questions
    {
      subjectId: chemistrySubject.id,
      questionText: "What is the chemical symbol for Gold?",
      questionType: QuestionType.FILL_BLANK,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: JSON.stringify({ acceptedAnswers: ["Au", "AU", "au"], caseSensitive: false }),
      tags: ["periodic-table", "elements", "grade-9"],
      explanation: "Gold's chemical symbol is Au, from the Latin 'aurum'.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: chemistrySubject.id,
      questionText: "Balance the equation: H₂ + O₂ → H₂O",
      questionType: QuestionType.SHORT_ANSWER,
      difficulty: DifficultyLevel.MEDIUM,
      bloomLevel: BloomLevel.APPLY,
      points: 3,
      timeEstimate: 5,
      sampleAnswer: "2H₂ + O₂ → 2H₂O",
      tags: ["chemical-equations", "balancing", "grade-10"],
      explanation: "We need 2 hydrogen molecules and 1 oxygen molecule to produce 2 water molecules.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: chemistrySubject.id,
      questionText: "What is the pH of a neutral solution at 25°C?",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 2,
      options: JSON.stringify([
        { text: "7", isCorrect: true },
        { text: "0", isCorrect: false },
        { text: "14", isCorrect: false },
        { text: "3.5", isCorrect: false }
      ]),
      tags: ["acids-bases", "ph", "grade-10"],
      explanation: "A neutral solution has equal concentrations of H⁺ and OH⁻ ions, resulting in pH = 7.",
      source: QuestionSource.MANUAL
    },

    // Biology Questions
    {
      subjectId: biologySubject.id,
      questionText: "What is the powerhouse of the cell?",
      questionType: QuestionType.FILL_BLANK,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: JSON.stringify({ acceptedAnswers: ["mitochondria", "Mitochondria", "mitochondrion"], caseSensitive: false }),
      tags: ["cell-biology", "organelles", "grade-9"],
      explanation: "Mitochondria produce ATP through cellular respiration.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: biologySubject.id,
      questionText: "Explain the process of photosynthesis in plants.",
      questionType: QuestionType.ESSAY,
      difficulty: DifficultyLevel.MEDIUM,
      bloomLevel: BloomLevel.UNDERSTAND,
      points: 10,
      timeEstimate: 15,
      sampleAnswer: "Photosynthesis is the process by which plants convert light energy into chemical energy. Chlorophyll in the chloroplasts absorbs sunlight, which is used to convert carbon dioxide and water into glucose and oxygen. The equation is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂",
      gradingRubric: "Full marks: Complete explanation with equation (10pts). Partial: Missing equation or incomplete explanation (5-7pts). Minimal: Basic understanding only (3-4pts).",
      tags: ["photosynthesis", "plant-biology", "grade-10"],
      explanation: "Photosynthesis occurs in two stages: light-dependent reactions and light-independent reactions (Calvin cycle).",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: biologySubject.id,
      questionText: "DNA stands for Deoxyribonucleic Acid.",
      questionType: QuestionType.TRUE_FALSE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: JSON.stringify([
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false }
      ]),
      tags: ["genetics", "dna", "grade-11"],
      explanation: "DNA is the molecule that carries genetic information in all living organisms.",
      source: QuestionSource.MANUAL
    },

    // English Questions
    {
      subjectId: englishSubject.id,
      questionText: "What is the plural form of 'child'?",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: JSON.stringify([
        { text: "children", isCorrect: true },
        { text: "childs", isCorrect: false },
        { text: "childrens", isCorrect: false },
        { text: "child's", isCorrect: false }
      ]),
      tags: ["grammar", "plurals", "grade-7"],
      explanation: "Child is an irregular noun, and its plural form is children.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: englishSubject.id,
      questionText: "Write a short paragraph (50-100 words) about your favorite season and why you like it.",
      questionType: QuestionType.ESSAY,
      difficulty: DifficultyLevel.MEDIUM,
      bloomLevel: BloomLevel.CREATE,
      points: 10,
      timeEstimate: 10,
      sampleAnswer: "My favorite season is autumn. I love watching the leaves change color from green to beautiful shades of red, orange, and yellow. The weather is perfect—not too hot and not too cold. I enjoy walking through parks covered in fallen leaves and the sound they make under my feet. Autumn also brings cozy evenings with hot chocolate and family gatherings during holidays.",
      gradingRubric: "Grammar and spelling (3pts), Content and creativity (4pts), Structure and coherence (3pts)",
      tags: ["writing", "creative", "grade-8"],
      explanation: "This question assesses creative writing and descriptive skills.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: englishSubject.id,
      questionText: "A simile compares two things using 'like' or 'as'.",
      questionType: QuestionType.TRUE_FALSE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: JSON.stringify([
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false }
      ]),
      tags: ["literature", "figurative-language", "grade-8"],
      explanation: "Example: 'She was as brave as a lion' is a simile.",
      source: QuestionSource.MANUAL
    },

    // Arabic Questions
    {
      subjectId: arabicSubject.id,
      questionText: "ما هو جمع كلمة 'كتاب'؟",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 2,
      options: JSON.stringify([
        { text: "كُتُب", isCorrect: true },
        { text: "كتابات", isCorrect: false },
        { text: "كاتب", isCorrect: false },
        { text: "مكتوب", isCorrect: false }
      ]),
      tags: ["grammar", "plurals", "grade-7"],
      explanation: "جمع كتاب هو كُتُب (جمع تكسير)",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: arabicSubject.id,
      questionText: "ما هي عاصمة السودان؟",
      questionType: QuestionType.FILL_BLANK,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: JSON.stringify({ acceptedAnswers: ["الخرطوم", "خرطوم"], caseSensitive: false }),
      tags: ["culture", "geography", "grade-7"],
      explanation: "الخرطوم هي عاصمة جمهورية السودان",
      source: QuestionSource.MANUAL
    },

    // History Questions
    {
      subjectId: historySubject.id,
      questionText: "In which year did World War II end?",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 2,
      options: JSON.stringify([
        { text: "1945", isCorrect: true },
        { text: "1939", isCorrect: false },
        { text: "1918", isCorrect: false },
        { text: "1950", isCorrect: false }
      ]),
      tags: ["world-war-2", "modern-history", "grade-10"],
      explanation: "World War II ended in 1945 with the surrender of Japan.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: historySubject.id,
      questionText: "Discuss the main causes of World War I.",
      questionType: QuestionType.ESSAY,
      difficulty: DifficultyLevel.HARD,
      bloomLevel: BloomLevel.ANALYZE,
      points: 15,
      timeEstimate: 20,
      sampleAnswer: "The main causes of World War I include: 1) Militarism - arms race among European powers, 2) Alliances - complex web of treaties, 3) Imperialism - competition for colonies, 4) Nationalism - pride and rivalry among nations. The assassination of Archduke Franz Ferdinand was the immediate trigger that set off these underlying tensions.",
      gradingRubric: "Identification of all 4 main causes (8pts), Analysis and explanation (5pts), Writing quality (2pts)",
      tags: ["world-war-1", "causes", "analysis", "grade-11"],
      explanation: "Remember MAIN: Militarism, Alliances, Imperialism, Nationalism.",
      source: QuestionSource.MANUAL
    },

    // Geography Questions
    {
      subjectId: geographySubject.id,
      questionText: "What is the largest ocean on Earth?",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: JSON.stringify([
        { text: "Pacific Ocean", isCorrect: true },
        { text: "Atlantic Ocean", isCorrect: false },
        { text: "Indian Ocean", isCorrect: false },
        { text: "Arctic Ocean", isCorrect: false }
      ]),
      tags: ["oceans", "physical-geography", "grade-7"],
      explanation: "The Pacific Ocean covers about 165 million square kilometers.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: geographySubject.id,
      questionText: "The Nile River is the longest river in the world.",
      questionType: QuestionType.TRUE_FALSE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: JSON.stringify([
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false }
      ]),
      tags: ["rivers", "africa", "grade-8"],
      explanation: "The Nile River in Africa is approximately 6,650 km long.",
      source: QuestionSource.MANUAL
    },

    // Computer Science Questions
    {
      subjectId: csSubject.id,
      questionText: "What does HTML stand for?",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 2,
      options: JSON.stringify([
        { text: "HyperText Markup Language", isCorrect: true },
        { text: "High Technology Modern Language", isCorrect: false },
        { text: "Hyper Transfer Markup Language", isCorrect: false },
        { text: "Home Tool Markup Language", isCorrect: false }
      ]),
      tags: ["web-development", "html", "grade-9"],
      explanation: "HTML is the standard markup language for creating web pages.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: csSubject.id,
      questionText: "What is the output of: print(5 + 3 * 2)?",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.MEDIUM,
      bloomLevel: BloomLevel.APPLY,
      points: 2,
      timeEstimate: 3,
      options: JSON.stringify([
        { text: "11", isCorrect: true },
        { text: "16", isCorrect: false },
        { text: "13", isCorrect: false },
        { text: "10", isCorrect: false }
      ]),
      tags: ["programming", "python", "operators", "grade-10"],
      explanation: "Following order of operations: 3 * 2 = 6, then 5 + 6 = 11",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: csSubject.id,
      questionText: "Binary is a base-2 number system.",
      questionType: QuestionType.TRUE_FALSE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: JSON.stringify([
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false }
      ]),
      tags: ["number-systems", "binary", "grade-9"],
      explanation: "Binary uses only two digits: 0 and 1.",
      source: QuestionSource.MANUAL
    },
  ];

  // Create all questions using raw SQL to avoid schema issues
  let createdCount = 0;
  for (const q of questions) {
    // Check if question exists
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM question_bank
      WHERE "schoolId" = ${schoolId}
      AND "subjectId" = ${q.subjectId}
      AND "questionText" = ${q.questionText}
      LIMIT 1
    `;

    if (!existing || existing.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO question_bank (
          id, "schoolId", "subjectId", "questionText", "questionType",
          difficulty, "bloomLevel", points, "timeEstimate", options,
          "sampleAnswer", "gradingRubric", tags, explanation, source,
          "createdBy", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), ${schoolId}, ${q.subjectId}, ${q.questionText},
          ${q.questionType}::"QuestionType", ${q.difficulty}::"DifficultyLevel",
          ${q.bloomLevel}::"BloomLevel", ${q.points}, ${q.timeEstimate},
          ${q.options}::jsonb, ${q.sampleAnswer || null},
          ${q.gradingRubric || null}, ${q.tags}::text[], ${q.explanation},
          ${q.source}::"QuestionSource", ${teacherId}, NOW(), NOW()
        )
      `;
      createdCount++;
    }
  }

  // Get total count
  const totalQuestions = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM question_bank WHERE "schoolId" = ${schoolId}
  `;

  console.log(`✅ Question Bank seeded successfully!`);
  console.log(`   - Created: ${createdCount} new questions`);
  console.log(`   - Total: ${Number(totalQuestions[0].count)} questions`);
  console.log("");
  console.log("🎓 Question Bank Coverage:");
  console.log("   - Mathematics: 5 questions (Easy/Medium/Hard)");
  console.log("   - Physics: 3 questions");
  console.log("   - Chemistry: 3 questions");
  console.log("   - Biology: 3 questions");
  console.log("   - English: 3 questions");
  console.log("   - Arabic: 2 questions");
  console.log("   - History: 2 questions");
  console.log("   - Geography: 2 questions");
  console.log("   - Computer Science: 3 questions");
  console.log("");
  console.log("🔗 View at: https://demo.databayt.org/en/exams/qbank");
}

seedQuestionBank()
  .catch((e) => {
    console.error("❌ Error seeding question bank:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
