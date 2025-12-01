/**
 * Comprehensive Exams Seed Module
 * Seeds all exam-related data: Question Bank, Templates, Exams, Auto-Marking, Results
 */

import {
  ExamType,
  ExamStatus,
  QuestionType,
  DifficultyLevel,
  BloomLevel,
  QuestionSource,
  GradingMethod,
  SubmissionType,
  MarkingStatus,
} from "@prisma/client";
import { faker } from "@faker-js/faker";
import type { SeedPrisma, StudentRef, SubjectRef, ClassRef, TeacherRef } from "./types";

// ============================================================================
// QUESTION BANK DATA
// ============================================================================

interface QuestionData {
  questionText: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  bloomLevel: BloomLevel;
  points: number;
  options?: object;
  sampleAnswer?: string;
  tags: string[];
  explanation?: string;
}

// Mathematics Questions
const mathQuestions: QuestionData[] = [
  {
    questionText: "What is the value of x if 2x + 5 = 15?",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.APPLY,
    points: 2,
    options: [
      { text: "5", isCorrect: true, explanation: "2(5) + 5 = 10 + 5 = 15" },
      { text: "10", isCorrect: false },
      { text: "7.5", isCorrect: false },
      { text: "3", isCorrect: false },
    ],
    tags: ["algebra", "linear-equations", "grade-9"],
    explanation: "Solve: 2x + 5 = 15 → 2x = 10 → x = 5",
  },
  {
    questionText: "The area of a circle is πr². Is this statement true or false?",
    questionType: QuestionType.TRUE_FALSE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "True", isCorrect: true },
      { text: "False", isCorrect: false },
    ],
    tags: ["geometry", "circles", "formulas"],
    explanation: "The formula for area of a circle is A = πr²",
  },
  {
    questionText: "Solve the quadratic equation: x² - 5x + 6 = 0",
    questionType: QuestionType.SHORT_ANSWER,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    points: 4,
    sampleAnswer: "x = 2 or x = 3. Factor: (x-2)(x-3) = 0",
    tags: ["algebra", "quadratic-equations", "factoring"],
    explanation: "Factor the equation to find (x-2)(x-3) = 0, giving x = 2 or x = 3",
  },
  {
    questionText: "The derivative of sin(x) is cos(x).",
    questionType: QuestionType.TRUE_FALSE,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "True", isCorrect: true },
      { text: "False", isCorrect: false },
    ],
    tags: ["calculus", "derivatives", "trigonometry"],
  },
  {
    questionText: "The value of π (pi) is approximately ___.",
    questionType: QuestionType.FILL_BLANK,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: { acceptedAnswers: ["3.14", "3.14159", "3.1416"], caseSensitive: false },
    tags: ["constants", "geometry"],
  },
  {
    questionText: "Explain why the Pythagorean theorem only applies to right triangles and provide a real-world application.",
    questionType: QuestionType.ESSAY,
    difficulty: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.EVALUATE,
    points: 10,
    sampleAnswer: "The Pythagorean theorem states that in a right triangle, a² + b² = c². It only applies to right triangles because the proof relies on the 90-degree angle to create similar triangles. Real-world applications include construction, navigation, and computer graphics.",
    tags: ["geometry", "pythagorean-theorem", "applications"],
  },
  {
    questionText: "What is the slope of the line passing through points (2, 3) and (4, 7)?",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    points: 2,
    options: [
      { text: "2", isCorrect: true, explanation: "m = (7-3)/(4-2) = 4/2 = 2" },
      { text: "4", isCorrect: false },
      { text: "1", isCorrect: false },
      { text: "0.5", isCorrect: false },
    ],
    tags: ["algebra", "coordinate-geometry", "slope"],
  },
  {
    questionText: "If f(x) = 3x² - 2x + 1, find f(2).",
    questionType: QuestionType.SHORT_ANSWER,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.APPLY,
    points: 2,
    sampleAnswer: "f(2) = 3(4) - 2(2) + 1 = 12 - 4 + 1 = 9",
    tags: ["functions", "evaluation"],
  },
];

// Physics Questions
const physicsQuestions: QuestionData[] = [
  {
    questionText: "Which of Newton's laws explains why passengers lurch forward when a car suddenly brakes?",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.UNDERSTAND,
    points: 2,
    options: [
      { text: "First Law (Inertia)", isCorrect: true, explanation: "Objects in motion tend to stay in motion" },
      { text: "Second Law (F=ma)", isCorrect: false },
      { text: "Third Law (Action-Reaction)", isCorrect: false },
      { text: "Law of Gravitation", isCorrect: false },
    ],
    tags: ["mechanics", "newton-laws", "inertia"],
  },
  {
    questionText: "Energy can be created or destroyed.",
    questionType: QuestionType.TRUE_FALSE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "True", isCorrect: false },
      { text: "False", isCorrect: true },
    ],
    tags: ["thermodynamics", "conservation-laws"],
    explanation: "Law of Conservation of Energy: Energy cannot be created or destroyed, only transformed.",
  },
  {
    questionText: "Calculate the kinetic energy of a 2 kg object moving at 3 m/s. Show your work.",
    questionType: QuestionType.SHORT_ANSWER,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    points: 4,
    sampleAnswer: "KE = ½mv² = ½(2)(3²) = ½(2)(9) = 9 Joules",
    tags: ["mechanics", "energy", "kinematics"],
  },
  {
    questionText: "The SI unit of force is the ___ (named after Isaac Newton).",
    questionType: QuestionType.FILL_BLANK,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: { acceptedAnswers: ["Newton", "newton", "N"], caseSensitive: false },
    tags: ["units", "force"],
  },
  {
    questionText: "Analyze the energy transformations that occur when a ball is thrown vertically upward and returns to the starting point.",
    questionType: QuestionType.ESSAY,
    difficulty: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.ANALYZE,
    points: 10,
    sampleAnswer: "When thrown upward: kinetic energy converts to gravitational potential energy. At peak: all KE becomes PE. Falling: PE converts back to KE. Some energy is lost to air resistance (heat). Total mechanical energy decreases slightly due to friction.",
    tags: ["mechanics", "energy-transformation", "kinematics"],
  },
  {
    questionText: "What is the acceleration due to gravity on Earth's surface?",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "9.8 m/s²", isCorrect: true },
      { text: "10 m/s", isCorrect: false },
      { text: "32 ft/s²", isCorrect: false },
      { text: "6.67 × 10⁻¹¹ N⋅m²/kg²", isCorrect: false },
    ],
    tags: ["gravity", "constants"],
  },
];

// English Questions
const englishQuestions: QuestionData[] = [
  {
    questionText: "Which literary device is used in 'The wind whispered through the trees'?",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.ANALYZE,
    points: 2,
    options: [
      { text: "Personification", isCorrect: true, explanation: "The wind is given human ability to whisper" },
      { text: "Metaphor", isCorrect: false },
      { text: "Simile", isCorrect: false },
      { text: "Alliteration", isCorrect: false },
    ],
    tags: ["literary-devices", "poetry", "figurative-language"],
  },
  {
    questionText: "A sonnet traditionally has 14 lines.",
    questionType: QuestionType.TRUE_FALSE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "True", isCorrect: true },
      { text: "False", isCorrect: false },
    ],
    tags: ["poetry", "sonnet", "forms"],
  },
  {
    questionText: "Write a brief analysis of the theme of ambition in Shakespeare's Macbeth.",
    questionType: QuestionType.ESSAY,
    difficulty: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.EVALUATE,
    points: 15,
    sampleAnswer: "Ambition in Macbeth is portrayed as a destructive force. Initially a loyal soldier, Macbeth's 'vaulting ambition' leads him to murder King Duncan. The play shows how unchecked ambition corrupts moral judgment and leads to psychological torment. Lady Macbeth's ambition drives her to madness, demonstrating the devastating consequences of prioritizing power over ethics.",
    tags: ["shakespeare", "macbeth", "themes", "tragedy"],
  },
  {
    questionText: "The correct form of the verb in 'She ___ to school every day' is:",
    questionType: QuestionType.FILL_BLANK,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.APPLY,
    points: 1,
    options: { acceptedAnswers: ["goes", "walks", "runs", "drives"], caseSensitive: false },
    tags: ["grammar", "verbs", "present-tense"],
  },
  {
    questionText: "Identify the subject and predicate in the sentence: 'The old man with the cane walked slowly.'",
    questionType: QuestionType.SHORT_ANSWER,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.ANALYZE,
    points: 3,
    sampleAnswer: "Subject: 'The old man with the cane' (complete subject); Predicate: 'walked slowly' (complete predicate)",
    tags: ["grammar", "sentence-structure", "syntax"],
  },
];

// Biology Questions
const biologyQuestions: QuestionData[] = [
  {
    questionText: "Which organelle is responsible for producing ATP in cells?",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 2,
    options: [
      { text: "Mitochondria", isCorrect: true, explanation: "Mitochondria are the 'powerhouse of the cell'" },
      { text: "Nucleus", isCorrect: false },
      { text: "Ribosome", isCorrect: false },
      { text: "Golgi apparatus", isCorrect: false },
    ],
    tags: ["cell-biology", "organelles", "energy"],
  },
  {
    questionText: "DNA is a double helix structure.",
    questionType: QuestionType.TRUE_FALSE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "True", isCorrect: true },
      { text: "False", isCorrect: false },
    ],
    tags: ["genetics", "dna", "molecular-biology"],
  },
  {
    questionText: "Describe the process of photosynthesis and explain its importance for life on Earth.",
    questionType: QuestionType.ESSAY,
    difficulty: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.UNDERSTAND,
    points: 12,
    sampleAnswer: "Photosynthesis converts light energy, water, and CO₂ into glucose and oxygen. The equation is: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂. It occurs in chloroplasts via light-dependent and light-independent reactions. Importance: produces oxygen for respiration, forms the base of food chains, and removes CO₂ from atmosphere.",
    tags: ["photosynthesis", "ecology", "biochemistry"],
  },
  {
    questionText: "The basic unit of heredity is called a ___.",
    questionType: QuestionType.FILL_BLANK,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: { acceptedAnswers: ["gene", "Gene"], caseSensitive: false },
    tags: ["genetics", "heredity"],
  },
  {
    questionText: "Explain the difference between mitosis and meiosis.",
    questionType: QuestionType.SHORT_ANSWER,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.UNDERSTAND,
    points: 4,
    sampleAnswer: "Mitosis produces 2 identical diploid cells for growth/repair. Meiosis produces 4 genetically different haploid cells (gametes) for reproduction. Meiosis involves 2 divisions and crossing over.",
    tags: ["cell-division", "genetics", "reproduction"],
  },
];

// Chemistry Questions
const chemistryQuestions: QuestionData[] = [
  {
    questionText: "What is the chemical symbol for gold?",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "Au", isCorrect: true, explanation: "From Latin 'aurum'" },
      { text: "Ag", isCorrect: false },
      { text: "Go", isCorrect: false },
      { text: "Gd", isCorrect: false },
    ],
    tags: ["elements", "periodic-table", "symbols"],
  },
  {
    questionText: "Water is a polar molecule.",
    questionType: QuestionType.TRUE_FALSE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "True", isCorrect: true },
      { text: "False", isCorrect: false },
    ],
    tags: ["molecular-structure", "polarity", "water"],
  },
  {
    questionText: "Balance the following chemical equation: H₂ + O₂ → H₂O",
    questionType: QuestionType.SHORT_ANSWER,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    points: 3,
    sampleAnswer: "2H₂ + O₂ → 2H₂O",
    tags: ["chemical-equations", "balancing", "stoichiometry"],
  },
  {
    questionText: "The pH of a neutral solution is ___.",
    questionType: QuestionType.FILL_BLANK,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: { acceptedAnswers: ["7", "seven"], caseSensitive: false },
    tags: ["acids-bases", "ph", "solutions"],
  },
  {
    questionText: "Explain why ionic compounds have high melting points compared to covalent compounds.",
    questionType: QuestionType.ESSAY,
    difficulty: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.EVALUATE,
    points: 10,
    sampleAnswer: "Ionic compounds have high melting points because they form crystal lattices with strong electrostatic forces between oppositely charged ions. Breaking these bonds requires significant energy. Covalent compounds have weaker intermolecular forces (van der Waals, hydrogen bonds) that require less energy to overcome, resulting in lower melting points.",
    tags: ["bonding", "ionic", "covalent", "properties"],
  },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================

export async function seedExams(
  prisma: SeedPrisma,
  schoolId: string,
  classes: ClassRef[],
  subjects: SubjectRef[],
  students: StudentRef[],
  teachers?: TeacherRef[]
): Promise<void> {
  console.log("📝 Creating comprehensive exam data...");

  // Get subject IDs
  const mathSubject = subjects.find((s) => s.subjectName === "Mathematics");
  const physicsSubject = subjects.find((s) => s.subjectName === "Physics");
  const englishSubject = subjects.find((s) => s.subjectName === "English Language");
  const biologySubject = subjects.find((s) => s.subjectName === "Biology") || subjects.find((s) => s.subjectName === "Science");
  const chemistrySubject = subjects.find((s) => s.subjectName === "Chemistry") || subjects.find((s) => s.subjectName === "Science");

  const teacherId = teachers?.[0]?.id || "system";

  // ========== 1. GRADE BOUNDARIES ==========
  console.log("   📊 Creating grade boundaries...");
  await prisma.gradeBoundary.createMany({
    data: [
      { schoolId, grade: "A+", minScore: "95.00", maxScore: "100.00", gpaValue: "4.00" },
      { schoolId, grade: "A", minScore: "90.00", maxScore: "94.99", gpaValue: "3.70" },
      { schoolId, grade: "B+", minScore: "85.00", maxScore: "89.99", gpaValue: "3.30" },
      { schoolId, grade: "B", minScore: "80.00", maxScore: "84.99", gpaValue: "3.00" },
      { schoolId, grade: "C+", minScore: "75.00", maxScore: "79.99", gpaValue: "2.70" },
      { schoolId, grade: "C", minScore: "70.00", maxScore: "74.99", gpaValue: "2.30" },
      { schoolId, grade: "D+", minScore: "65.00", maxScore: "69.99", gpaValue: "2.00" },
      { schoolId, grade: "D", minScore: "60.00", maxScore: "64.99", gpaValue: "1.70" },
      { schoolId, grade: "F", minScore: "0.00", maxScore: "59.99", gpaValue: "0.00" },
    ],
    skipDuplicates: true,
  });

  // ========== 2. QUESTION BANK ==========
  console.log("   📚 Creating question bank...");
  const createdQuestions: { id: string; subjectId: string; questionType: QuestionType; points: number }[] = [];

  // Helper to create questions for a subject
  async function createQuestionsForSubject(
    subjectId: string | undefined,
    questions: QuestionData[]
  ) {
    if (!subjectId) return;

    for (const q of questions) {
      const question = await prisma.questionBank.create({
        data: {
          schoolId,
          subjectId,
          questionText: q.questionText,
          questionType: q.questionType,
          difficulty: q.difficulty,
          bloomLevel: q.bloomLevel,
          points: q.points,
          options: q.options || undefined,
          sampleAnswer: q.sampleAnswer,
          tags: q.tags,
          explanation: q.explanation,
          source: QuestionSource.MANUAL,
          createdBy: teacherId,
        },
      });
      createdQuestions.push({
        id: question.id,
        subjectId,
        questionType: q.questionType,
        points: Number(q.points),
      });
    }
  }

  await createQuestionsForSubject(mathSubject?.id, mathQuestions);
  await createQuestionsForSubject(physicsSubject?.id, physicsQuestions);
  await createQuestionsForSubject(englishSubject?.id, englishQuestions);
  await createQuestionsForSubject(biologySubject?.id, biologyQuestions);
  await createQuestionsForSubject(chemistrySubject?.id, chemistryQuestions);

  // ========== 3. QUESTION ANALYTICS ==========
  console.log("   📈 Creating question analytics...");
  for (const q of createdQuestions) {
    await prisma.questionAnalytics.create({
      data: {
        schoolId,
        questionId: q.id,
        timesUsed: faker.number.int({ min: 5, max: 50 }),
        avgScore: faker.number.float({ min: 50, max: 95, fractionDigits: 2 }).toString(),
        successRate: faker.number.float({ min: 40, max: 90, fractionDigits: 2 }),
        avgTimeSpent: faker.number.float({ min: 2, max: 15, fractionDigits: 1 }),
        lastUsed: faker.date.recent({ days: 30 }),
      },
    });
  }

  // ========== 4. EXAM TEMPLATES ==========
  console.log("   📋 Creating exam templates...");
  const templates: { id: string; subjectId: string }[] = [];

  if (mathSubject) {
    const template = await prisma.examTemplate.create({
      data: {
        schoolId,
        name: "Mathematics Mid-Term Template",
        description: "Standard mid-term exam with balanced question distribution",
        subjectId: mathSubject.id,
        duration: 90,
        totalMarks: 50,
        distribution: {
          MULTIPLE_CHOICE: { EASY: 5, MEDIUM: 5 },
          SHORT_ANSWER: { MEDIUM: 3, HARD: 2 },
          ESSAY: { HARD: 1 },
        },
        bloomDistribution: {
          REMEMBER: 4,
          UNDERSTAND: 3,
          APPLY: 5,
          ANALYZE: 2,
          EVALUATE: 1,
        },
        createdBy: teacherId,
        isActive: true,
      },
    });
    templates.push({ id: template.id, subjectId: mathSubject.id });
  }

  if (physicsSubject) {
    const template = await prisma.examTemplate.create({
      data: {
        schoolId,
        name: "Physics Final Exam Template",
        description: "Comprehensive final exam covering all topics",
        subjectId: physicsSubject.id,
        duration: 120,
        totalMarks: 100,
        distribution: {
          MULTIPLE_CHOICE: { EASY: 10, MEDIUM: 10, HARD: 5 },
          TRUE_FALSE: { EASY: 5 },
          SHORT_ANSWER: { MEDIUM: 5, HARD: 3 },
          ESSAY: { HARD: 2 },
        },
        createdBy: teacherId,
        isActive: true,
      },
    });
    templates.push({ id: template.id, subjectId: physicsSubject.id });
  }

  // ========== 5. EXAMS ==========
  console.log("   📝 Creating exams...");
  const exams: { id: string; subjectId: string; status: ExamStatus; classId: string }[] = [];

  // Define exam subjects
  const examSubjects = [
    { subject: mathSubject, name: "Mathematics" },
    { subject: physicsSubject, name: "Physics" },
    { subject: englishSubject, name: "English" },
    { subject: biologySubject, name: "Biology" },
    { subject: chemistrySubject, name: "Chemistry" },
  ].filter((s) => s.subject);

  for (const { subject, name } of examSubjects) {
    if (!subject) continue;

    // Completed Midterm
    const midterm = await prisma.exam.create({
      data: {
        schoolId,
        title: `${name} Mid-Term Examination`,
        description: `Comprehensive mid-term assessment for ${name}`,
        classId: classes[0].id,
        subjectId: subject.id,
        examDate: new Date("2025-11-15T00:00:00Z"),
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        totalMarks: 100,
        passingMarks: 50,
        examType: ExamType.MIDTERM,
        status: ExamStatus.COMPLETED,
        instructions: "Answer all questions. Show your work for partial credit.",
      },
    });
    exams.push({ id: midterm.id, subjectId: subject.id, status: ExamStatus.COMPLETED, classId: classes[0].id });

    // Upcoming Final
    const final = await prisma.exam.create({
      data: {
        schoolId,
        title: `${name} Final Examination`,
        description: `End of term final examination for ${name}`,
        classId: classes[0].id,
        subjectId: subject.id,
        examDate: new Date("2026-01-20T00:00:00Z"),
        startTime: "09:00",
        endTime: "12:00",
        duration: 180,
        totalMarks: 100,
        passingMarks: 50,
        examType: ExamType.FINAL,
        status: ExamStatus.PLANNED,
        instructions: "This is a comprehensive final exam. Read all instructions carefully.",
      },
    });
    exams.push({ id: final.id, subjectId: subject.id, status: ExamStatus.PLANNED, classId: classes[0].id });

    // Quiz (in progress)
    if (classes.length > 1) {
      const quiz = await prisma.exam.create({
        data: {
          schoolId,
          title: `${name} Pop Quiz`,
          description: `Quick assessment on recent topics`,
          classId: classes[1].id,
          subjectId: subject.id,
          examDate: new Date(),
          startTime: "14:00",
          endTime: "14:30",
          duration: 30,
          totalMarks: 20,
          passingMarks: 10,
          examType: ExamType.QUIZ,
          status: ExamStatus.IN_PROGRESS,
        },
      });
      exams.push({ id: quiz.id, subjectId: subject.id, status: ExamStatus.IN_PROGRESS, classId: classes[1].id });
    }
  }

  // ========== 6. GENERATED EXAMS (link questions to exams) ==========
  console.log("   🔗 Creating generated exams with questions...");
  const completedExams = exams.filter((e) => e.status === ExamStatus.COMPLETED);

  for (const exam of completedExams) {
    const template = templates.find((t) => t.subjectId === exam.subjectId);
    const examQuestions = createdQuestions.filter((q) => q.subjectId === exam.subjectId);

    if (examQuestions.length === 0) continue;

    const generatedExam = await prisma.generatedExam.create({
      data: {
        schoolId,
        examId: exam.id,
        templateId: template?.id || null,
        isRandomized: true,
        seed: faker.string.alphanumeric(10),
        totalQuestions: Math.min(examQuestions.length, 10),
        generationNotes: "Auto-generated from question bank",
        generatedBy: teacherId,
      },
    });

    // Add questions to the generated exam
    const questionsToAdd = examQuestions.slice(0, 10);
    for (let i = 0; i < questionsToAdd.length; i++) {
      await prisma.generatedExamQuestion.create({
        data: {
          schoolId,
          generatedExamId: generatedExam.id,
          questionId: questionsToAdd[i].id,
          order: i + 1,
          points: questionsToAdd[i].points,
        },
      });
    }
  }

  // ========== 7. RUBRICS FOR ESSAY QUESTIONS ==========
  console.log("   📐 Creating rubrics for essay questions...");
  const essayQuestions = createdQuestions.filter((q) => q.questionType === QuestionType.ESSAY);

  for (const question of essayQuestions) {
    const rubric = await prisma.rubric.create({
      data: {
        schoolId,
        questionId: question.id,
        title: "Essay Grading Rubric",
        description: "Standard rubric for evaluating essay responses",
        totalPoints: question.points,
      },
    });

    // Add rubric criteria
    const criteriaData = [
      { criterion: "Content & Understanding", description: "Demonstrates thorough understanding of concepts", maxPoints: question.points * 0.4, order: 1 },
      { criterion: "Organization & Structure", description: "Clear introduction, body, and conclusion", maxPoints: question.points * 0.2, order: 2 },
      { criterion: "Critical Analysis", description: "Shows critical thinking and analysis", maxPoints: question.points * 0.25, order: 3 },
      { criterion: "Grammar & Mechanics", description: "Proper grammar, spelling, and punctuation", maxPoints: question.points * 0.15, order: 4 },
    ];

    for (const criteria of criteriaData) {
      await prisma.rubricCriterion.create({
        data: {
          schoolId,
          rubricId: rubric.id,
          ...criteria,
        },
      });
    }
  }

  // ========== 8. EXAM RESULTS & STUDENT ANSWERS ==========
  console.log("   ✏️ Creating student answers and exam results...");

  for (const exam of completedExams) {
    const examQuestions = createdQuestions.filter((q) => q.subjectId === exam.subjectId).slice(0, 10);

    // Create results for students
    for (let i = 0; i < Math.min(30, students.length); i++) {
      const student = students[i];
      const marks = faker.number.int({ min: 35, max: 98 });
      const percentage = marks;
      const grade =
        marks >= 90 ? "A" : marks >= 80 ? "B" : marks >= 70 ? "C" : marks >= 60 ? "D" : "F";

      // Create exam result
      await prisma.examResult.create({
        data: {
          schoolId,
          examId: exam.id,
          studentId: student.id,
          marksObtained: marks,
          totalMarks: 100,
          percentage,
          grade,
          isAbsent: faker.datatype.boolean({ probability: 0.05 }),
          remarks: marks >= 80 ? "Excellent performance" : marks >= 60 ? "Good effort" : "Needs improvement",
        },
      });

      // Create student answers and marking results for each question
      for (const question of examQuestions) {
        const autoGradableTypes: QuestionType[] = [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE, QuestionType.FILL_BLANK];
        const isAutoGradable = autoGradableTypes.includes(question.questionType);
        const gradingMethod = isAutoGradable ? GradingMethod.AUTO : question.questionType === QuestionType.ESSAY ? GradingMethod.AI_ASSISTED : GradingMethod.MANUAL;

        const studentAnswer = await prisma.studentAnswer.create({
          data: {
            schoolId,
            examId: exam.id,
            questionId: question.id,
            studentId: student.id,
            submissionType: SubmissionType.DIGITAL,
            answerText: question.questionType === QuestionType.ESSAY ? faker.lorem.paragraphs(2) : faker.lorem.sentence(),
            selectedOptionIds: question.questionType === QuestionType.MULTIPLE_CHOICE ? [String(faker.number.int({ min: 0, max: 3 }))] : [],
            submittedAt: new Date(),
          },
        });

        // Create marking result
        const scorePercentage = faker.number.float({ min: 0.4, max: 1.0, fractionDigits: 2 });
        const pointsAwarded = (question.points * scorePercentage).toFixed(2);

        await prisma.markingResult.create({
          data: {
            schoolId,
            studentAnswerId: studentAnswer.id,
            examId: exam.id,
            questionId: question.id,
            studentId: student.id,
            gradingMethod,
            status: MarkingStatus.COMPLETED,
            pointsAwarded,
            maxPoints: question.points,
            aiScore: gradingMethod !== GradingMethod.MANUAL ? pointsAwarded : null,
            aiConfidence: gradingMethod !== GradingMethod.MANUAL ? faker.number.float({ min: 0.7, max: 0.98, fractionDigits: 2 }) : null,
            aiReasoning: gradingMethod === GradingMethod.AI_ASSISTED ? "Response demonstrates good understanding of key concepts." : null,
            feedback: faker.helpers.arrayElement([
              "Good work!",
              "Well explained.",
              "Could improve with more detail.",
              "Review the key concepts.",
              null,
            ]),
            gradedBy: teacherId,
            gradedAt: new Date(),
            needsReview: false,
            wasOverridden: false,
          },
        });
      }
    }
  }

  // Summary
  const questionCount = createdQuestions.length;
  const examCount = exams.length;
  const templateCount = templates.length;

  console.log(`   ✅ Created:`);
  console.log(`      - ${questionCount} questions in question bank`);
  console.log(`      - ${templateCount} exam templates`);
  console.log(`      - ${examCount} exams (midterms, finals, quizzes)`);
  console.log(`      - ${essayQuestions.length} rubrics with criteria`);
  console.log(`      - ${completedExams.length * Math.min(30, students.length)} exam results`);
  console.log(`      - Student answers and marking results\n`);
}
