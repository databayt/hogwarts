/**
 * Comprehensive Exams Seed Module
 * Seeds all exam-related data: Question Bank, Templates, Exams, Auto-Marking, Results
 */

import { faker } from "@faker-js/faker"
import {
  BloomLevel,
  DifficultyLevel,
  ExamStatus,
  ExamType,
  GradingMethod,
  MarkingStatus,
  QuestionSource,
  QuestionType,
  SubmissionType,
} from "@prisma/client"

import type {
  ClassRef,
  SeedPrisma,
  StudentRef,
  SubjectRef,
  TeacherRef,
} from "./types"

// ============================================================================
// QUESTION BANK DATA
// ============================================================================

interface QuestionData {
  questionText: string
  questionType: QuestionType
  difficulty: DifficultyLevel
  bloomLevel: BloomLevel
  points: number
  options?: object
  sampleAnswer?: string
  tags: string[]
  explanation?: string
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
    questionText:
      "The area of a circle is πr². Is this statement true or false?",
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
    explanation:
      "Factor the equation to find (x-2)(x-3) = 0, giving x = 2 or x = 3",
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
    options: {
      acceptedAnswers: ["3.14", "3.14159", "3.1416"],
      caseSensitive: false,
    },
    tags: ["constants", "geometry"],
  },
  {
    questionText:
      "Explain why the Pythagorean theorem only applies to right triangles and provide a real-world application.",
    questionType: QuestionType.ESSAY,
    difficulty: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.EVALUATE,
    points: 10,
    sampleAnswer:
      "The Pythagorean theorem states that in a right triangle, a² + b² = c². It only applies to right triangles because the proof relies on the 90-degree angle to create similar triangles. Real-world applications include construction, navigation, and computer graphics.",
    tags: ["geometry", "pythagorean-theorem", "applications"],
  },
  {
    questionText:
      "What is the slope of the line passing through points (2, 3) and (4, 7)?",
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
]

// Physics Questions
const physicsQuestions: QuestionData[] = [
  {
    questionText:
      "Which of Newton's laws explains why passengers lurch forward when a car suddenly brakes?",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.UNDERSTAND,
    points: 2,
    options: [
      {
        text: "First Law (Inertia)",
        isCorrect: true,
        explanation: "Objects in motion tend to stay in motion",
      },
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
    explanation:
      "Law of Conservation of Energy: Energy cannot be created or destroyed, only transformed.",
  },
  {
    questionText:
      "Calculate the kinetic energy of a 2 kg object moving at 3 m/s. Show your work.",
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
    options: {
      acceptedAnswers: ["Newton", "newton", "N"],
      caseSensitive: false,
    },
    tags: ["units", "force"],
  },
  {
    questionText:
      "Analyze the energy transformations that occur when a ball is thrown vertically upward and returns to the starting point.",
    questionType: QuestionType.ESSAY,
    difficulty: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.ANALYZE,
    points: 10,
    sampleAnswer:
      "When thrown upward: kinetic energy converts to gravitational potential energy. At peak: all KE becomes PE. Falling: PE converts back to KE. Some energy is lost to air resistance (heat). Total mechanical energy decreases slightly due to friction.",
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
]

// English Questions
const englishQuestions: QuestionData[] = [
  {
    questionText:
      "Which literary device is used in 'The wind whispered through the trees'?",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.ANALYZE,
    points: 2,
    options: [
      {
        text: "Personification",
        isCorrect: true,
        explanation: "The wind is given human ability to whisper",
      },
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
    questionText:
      "Write a brief analysis of the theme of ambition in Shakespeare's Macbeth.",
    questionType: QuestionType.ESSAY,
    difficulty: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.EVALUATE,
    points: 15,
    sampleAnswer:
      "Ambition in Macbeth is portrayed as a destructive force. Initially a loyal soldier, Macbeth's 'vaulting ambition' leads him to murder King Duncan. The play shows how unchecked ambition corrupts moral judgment and leads to psychological torment. Lady Macbeth's ambition drives her to madness, demonstrating the devastating consequences of prioritizing power over ethics.",
    tags: ["shakespeare", "macbeth", "themes", "tragedy"],
  },
  {
    questionText:
      "The correct form of the verb in 'She ___ to school every day' is:",
    questionType: QuestionType.FILL_BLANK,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.APPLY,
    points: 1,
    options: {
      acceptedAnswers: ["goes", "walks", "runs", "drives"],
      caseSensitive: false,
    },
    tags: ["grammar", "verbs", "present-tense"],
  },
  {
    questionText:
      "Identify the subject and predicate in the sentence: 'The old man with the cane walked slowly.'",
    questionType: QuestionType.SHORT_ANSWER,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.ANALYZE,
    points: 3,
    sampleAnswer:
      "Subject: 'The old man with the cane' (complete subject); Predicate: 'walked slowly' (complete predicate)",
    tags: ["grammar", "sentence-structure", "syntax"],
  },
]

// Biology Questions
const biologyQuestions: QuestionData[] = [
  {
    questionText: "Which organelle is responsible for producing ATP in cells?",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 2,
    options: [
      {
        text: "Mitochondria",
        isCorrect: true,
        explanation: "Mitochondria are the 'powerhouse of the cell'",
      },
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
    questionText:
      "Describe the process of photosynthesis and explain its importance for life on Earth.",
    questionType: QuestionType.ESSAY,
    difficulty: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.UNDERSTAND,
    points: 12,
    sampleAnswer:
      "Photosynthesis converts light energy, water, and CO₂ into glucose and oxygen. The equation is: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂. It occurs in chloroplasts via light-dependent and light-independent reactions. Importance: produces oxygen for respiration, forms the base of food chains, and removes CO₂ from atmosphere.",
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
    sampleAnswer:
      "Mitosis produces 2 identical diploid cells for growth/repair. Meiosis produces 4 genetically different haploid cells (gametes) for reproduction. Meiosis involves 2 divisions and crossing over.",
    tags: ["cell-division", "genetics", "reproduction"],
  },
]

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
    questionText:
      "Explain why ionic compounds have high melting points compared to covalent compounds.",
    questionType: QuestionType.ESSAY,
    difficulty: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.EVALUATE,
    points: 10,
    sampleAnswer:
      "Ionic compounds have high melting points because they form crystal lattices with strong electrostatic forces between oppositely charged ions. Breaking these bonds requires significant energy. Covalent compounds have weaker intermolecular forces (van der Waals, hydrogen bonds) that require less energy to overcome, resulting in lower melting points.",
    tags: ["bonding", "ionic", "covalent", "properties"],
  },
  {
    questionText: "Which element has the atomic number 6?",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "Carbon", isCorrect: true },
      { text: "Oxygen", isCorrect: false },
      { text: "Nitrogen", isCorrect: false },
      { text: "Helium", isCorrect: false },
    ],
    tags: ["elements", "atomic-number", "periodic-table"],
  },
  {
    questionText: "Noble gases are chemically reactive.",
    questionType: QuestionType.TRUE_FALSE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "True", isCorrect: false },
      { text: "False", isCorrect: true },
    ],
    tags: ["noble-gases", "periodic-table", "reactivity"],
    explanation:
      "Noble gases have complete outer electron shells, making them chemically inert.",
  },
  {
    questionText: "The number of protons in an atom equals the ___.",
    questionType: QuestionType.FILL_BLANK,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: {
      acceptedAnswers: ["atomic number", "number of electrons"],
      caseSensitive: false,
    },
    tags: ["atomic-structure", "protons"],
  },
]

// Computer Science Questions
const computerScienceQuestions: QuestionData[] = [
  {
    questionText: "What does CPU stand for?",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "Central Processing Unit", isCorrect: true },
      { text: "Computer Personal Unit", isCorrect: false },
      { text: "Central Program Unit", isCorrect: false },
      { text: "Computer Processing Unit", isCorrect: false },
    ],
    tags: ["hardware", "cpu", "basics"],
  },
  {
    questionText: "HTML is a programming language.",
    questionType: QuestionType.TRUE_FALSE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "True", isCorrect: false },
      { text: "False", isCorrect: true },
    ],
    tags: ["web", "html", "markup"],
    explanation: "HTML is a markup language, not a programming language.",
  },
  {
    questionText:
      "Which data structure follows the LIFO (Last In First Out) principle?",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.UNDERSTAND,
    points: 2,
    options: [
      { text: "Stack", isCorrect: true },
      { text: "Queue", isCorrect: false },
      { text: "Array", isCorrect: false },
      { text: "Linked List", isCorrect: false },
    ],
    tags: ["data-structures", "stack", "algorithms"],
  },
  {
    questionText:
      "Write a function in Python to calculate the factorial of a number.",
    questionType: QuestionType.SHORT_ANSWER,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    points: 5,
    sampleAnswer:
      "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n-1)",
    tags: ["python", "recursion", "functions"],
  },
  {
    questionText: "The time complexity of binary search is ___.",
    questionType: QuestionType.FILL_BLANK,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.UNDERSTAND,
    points: 2,
    options: {
      acceptedAnswers: ["O(log n)", "O(logn)", "log n"],
      caseSensitive: false,
    },
    tags: ["algorithms", "complexity", "search"],
  },
  {
    questionText:
      "Explain the difference between compilation and interpretation in programming languages.",
    questionType: QuestionType.ESSAY,
    difficulty: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.EVALUATE,
    points: 10,
    sampleAnswer:
      "Compilation translates entire source code to machine code before execution (C, C++), producing fast executables but requiring recompilation for changes. Interpretation executes code line by line at runtime (Python, JavaScript), offering flexibility and easier debugging but slower execution. JIT compilers combine both approaches for optimization.",
    tags: ["programming-languages", "compilation", "interpretation"],
  },
  {
    questionText:
      "Which of the following is NOT a valid JavaScript variable declaration?",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.ANALYZE,
    points: 2,
    options: [
      { text: "variable x = 5", isCorrect: true },
      { text: "let x = 5", isCorrect: false },
      { text: "const x = 5", isCorrect: false },
      { text: "var x = 5", isCorrect: false },
    ],
    tags: ["javascript", "variables", "syntax"],
  },
  {
    questionText: "SQL stands for ___.",
    questionType: QuestionType.FILL_BLANK,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: {
      acceptedAnswers: ["Structured Query Language"],
      caseSensitive: false,
    },
    tags: ["databases", "sql", "basics"],
  },
]

// History Questions
const historyQuestions: QuestionData[] = [
  {
    questionText: "In which year did World War II end?",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "1945", isCorrect: true },
      { text: "1944", isCorrect: false },
      { text: "1946", isCorrect: false },
      { text: "1943", isCorrect: false },
    ],
    tags: ["world-war-2", "20th-century", "dates"],
  },
  {
    questionText: "The French Revolution began in 1789.",
    questionType: QuestionType.TRUE_FALSE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "True", isCorrect: true },
      { text: "False", isCorrect: false },
    ],
    tags: ["french-revolution", "18th-century", "europe"],
  },
  {
    questionText: "Who was the first President of the United States?",
    questionType: QuestionType.SHORT_ANSWER,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 2,
    sampleAnswer: "George Washington",
    tags: ["american-history", "presidents", "18th-century"],
  },
  {
    questionText:
      "The ancient city of ___ was destroyed by the eruption of Mount Vesuvius in 79 AD.",
    questionType: QuestionType.FILL_BLANK,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.REMEMBER,
    points: 2,
    options: { acceptedAnswers: ["Pompeii", "pompeii"], caseSensitive: false },
    tags: ["ancient-rome", "natural-disasters", "1st-century"],
  },
  {
    questionText:
      "Analyze the causes and consequences of the Industrial Revolution on society.",
    questionType: QuestionType.ESSAY,
    difficulty: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.ANALYZE,
    points: 15,
    sampleAnswer:
      "The Industrial Revolution (1760-1840) was caused by agricultural improvements, capital accumulation, natural resources, and technological innovation. Consequences included urbanization, new social classes (industrial capitalists and working class), child labor, environmental pollution, but also increased productivity, improved living standards over time, and global trade expansion.",
    tags: ["industrial-revolution", "18th-century", "social-change"],
  },
  {
    questionText: "Which civilization built the pyramids of Giza?",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "Ancient Egyptians", isCorrect: true },
      { text: "Ancient Greeks", isCorrect: false },
      { text: "Mayans", isCorrect: false },
      { text: "Romans", isCorrect: false },
    ],
    tags: ["ancient-egypt", "pyramids", "civilizations"],
  },
]

// Geography Questions
const geographyQuestions: QuestionData[] = [
  {
    questionText: "What is the largest continent by land area?",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "Asia", isCorrect: true },
      { text: "Africa", isCorrect: false },
      { text: "North America", isCorrect: false },
      { text: "Europe", isCorrect: false },
    ],
    tags: ["continents", "physical-geography"],
  },
  {
    questionText: "The Amazon River is the longest river in the world.",
    questionType: QuestionType.TRUE_FALSE,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "True", isCorrect: false },
      { text: "False", isCorrect: true },
    ],
    tags: ["rivers", "south-america"],
    explanation:
      "The Nile River is the longest; Amazon is the largest by volume.",
  },
  {
    questionText: "Name the capital city of Japan.",
    questionType: QuestionType.SHORT_ANSWER,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    sampleAnswer: "Tokyo",
    tags: ["capitals", "asia", "japan"],
  },
  {
    questionText: "The deepest ocean trench is the ___ Trench.",
    questionType: QuestionType.FILL_BLANK,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.REMEMBER,
    points: 2,
    options: {
      acceptedAnswers: ["Mariana", "mariana", "Marianas"],
      caseSensitive: false,
    },
    tags: ["oceans", "physical-geography"],
  },
  {
    questionText:
      "Explain how plate tectonics cause earthquakes and volcanic activity.",
    questionType: QuestionType.ESSAY,
    difficulty: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.UNDERSTAND,
    points: 12,
    sampleAnswer:
      "Earth's lithosphere is divided into tectonic plates floating on the asthenosphere. At convergent boundaries, plates collide causing earthquakes and volcanic mountains. At divergent boundaries, plates separate allowing magma to rise. Transform boundaries cause lateral movement and earthquakes. The Pacific Ring of Fire demonstrates these processes with 75% of world's volcanoes.",
    tags: ["plate-tectonics", "earthquakes", "volcanoes"],
  },
  {
    questionText: "Which country has the largest population?",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "India", isCorrect: true },
      { text: "China", isCorrect: false },
      { text: "United States", isCorrect: false },
      { text: "Indonesia", isCorrect: false },
    ],
    tags: ["population", "demographics"],
  },
]

// Arabic Language Questions (for Arabic schools)
const arabicQuestions: QuestionData[] = [
  {
    questionText: "ما هو جمع كلمة 'كتاب'؟",
    questionType: QuestionType.MULTIPLE_CHOICE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "كُتُب", isCorrect: true },
      { text: "كتابات", isCorrect: false },
      { text: "كتّاب", isCorrect: false },
      { text: "مكاتب", isCorrect: false },
    ],
    tags: ["grammar", "plurals", "arabic"],
  },
  {
    questionText: "الفعل الماضي من 'يكتب' هو 'كتب'.",
    questionType: QuestionType.TRUE_FALSE,
    difficulty: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    points: 1,
    options: [
      { text: "صحيح", isCorrect: true },
      { text: "خطأ", isCorrect: false },
    ],
    tags: ["grammar", "verbs", "arabic"],
  },
  {
    questionText: "أعرب الجملة التالية: 'قرأ الطالب الكتاب'",
    questionType: QuestionType.SHORT_ANSWER,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    points: 4,
    sampleAnswer:
      "قرأ: فعل ماضٍ مبني على الفتح. الطالب: فاعل مرفوع بالضمة. الكتاب: مفعول به منصوب بالفتحة.",
    tags: ["grammar", "parsing", "arabic"],
  },
  {
    questionText: "اكتب موضوعاً تعبيرياً عن أهمية القراءة في حياة الإنسان.",
    questionType: QuestionType.ESSAY,
    difficulty: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.CREATE,
    points: 15,
    sampleAnswer:
      "القراءة غذاء الروح والعقل، فهي تنمي المعرفة وتوسع الأفق وتثري اللغة. من خلال القراءة نتعرف على ثقافات الشعوب ونستفيد من تجارب الآخرين. إنها المفتاح الذي يفتح أبواب النجاح والتقدم.",
    tags: ["composition", "expression", "arabic"],
  },
  {
    questionText: "الهمزة في كلمة 'سماء' تُسمى همزة ___.",
    questionType: QuestionType.FILL_BLANK,
    difficulty: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.UNDERSTAND,
    points: 2,
    options: { acceptedAnswers: ["متطرفة", "المتطرفة"], caseSensitive: false },
    tags: ["spelling", "hamza", "arabic"],
  },
]

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
  console.log("📝 Creating comprehensive exam data...")

  // Get subject IDs
  const mathSubject = subjects.find((s) => s.subjectName === "Mathematics")
  const physicsSubject = subjects.find((s) => s.subjectName === "Physics")
  const englishSubject = subjects.find(
    (s) => s.subjectName === "English Language"
  )
  const biologySubject =
    subjects.find((s) => s.subjectName === "Biology") ||
    subjects.find((s) => s.subjectName === "Science")
  const chemistrySubject =
    subjects.find((s) => s.subjectName === "Chemistry") ||
    subjects.find((s) => s.subjectName === "Science")
  const csSubject =
    subjects.find((s) => s.subjectName === "Computer Science") ||
    subjects.find((s) => s.subjectName === "ICT")
  const historySubject =
    subjects.find((s) => s.subjectName === "History") ||
    subjects.find((s) => s.subjectName === "Social Studies")
  const geographySubject =
    subjects.find((s) => s.subjectName === "Geography") ||
    subjects.find((s) => s.subjectName === "Social Studies")
  const arabicSubject =
    subjects.find((s) => s.subjectName === "Arabic Language") ||
    subjects.find((s) => s.subjectName === "Arabic")

  const teacherId = teachers?.[0]?.id || "system"

  // ========== 1. GRADE BOUNDARIES ==========
  console.log("   📊 Creating grade boundaries...")
  await prisma.gradeBoundary.createMany({
    data: [
      {
        schoolId,
        grade: "A+",
        minScore: "95.00",
        maxScore: "100.00",
        gpaValue: "4.00",
      },
      {
        schoolId,
        grade: "A",
        minScore: "90.00",
        maxScore: "94.99",
        gpaValue: "3.70",
      },
      {
        schoolId,
        grade: "B+",
        minScore: "85.00",
        maxScore: "89.99",
        gpaValue: "3.30",
      },
      {
        schoolId,
        grade: "B",
        minScore: "80.00",
        maxScore: "84.99",
        gpaValue: "3.00",
      },
      {
        schoolId,
        grade: "C+",
        minScore: "75.00",
        maxScore: "79.99",
        gpaValue: "2.70",
      },
      {
        schoolId,
        grade: "C",
        minScore: "70.00",
        maxScore: "74.99",
        gpaValue: "2.30",
      },
      {
        schoolId,
        grade: "D+",
        minScore: "65.00",
        maxScore: "69.99",
        gpaValue: "2.00",
      },
      {
        schoolId,
        grade: "D",
        minScore: "60.00",
        maxScore: "64.99",
        gpaValue: "1.70",
      },
      {
        schoolId,
        grade: "F",
        minScore: "0.00",
        maxScore: "59.99",
        gpaValue: "0.00",
      },
    ],
    skipDuplicates: true,
  })

  // ========== 2. QUESTION BANK ==========
  console.log("   📚 Creating question bank...")
  const createdQuestions: {
    id: string
    subjectId: string
    questionType: QuestionType
    points: number
  }[] = []

  // Helper to create questions for a subject
  async function createQuestionsForSubject(
    subjectId: string | undefined,
    questions: QuestionData[]
  ) {
    if (!subjectId) return

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
      })
      createdQuestions.push({
        id: question.id,
        subjectId,
        questionType: q.questionType,
        points: Number(q.points),
      })
    }
  }

  await createQuestionsForSubject(mathSubject?.id, mathQuestions)
  await createQuestionsForSubject(physicsSubject?.id, physicsQuestions)
  await createQuestionsForSubject(englishSubject?.id, englishQuestions)
  await createQuestionsForSubject(biologySubject?.id, biologyQuestions)
  await createQuestionsForSubject(chemistrySubject?.id, chemistryQuestions)
  await createQuestionsForSubject(csSubject?.id, computerScienceQuestions)
  await createQuestionsForSubject(historySubject?.id, historyQuestions)
  await createQuestionsForSubject(geographySubject?.id, geographyQuestions)
  await createQuestionsForSubject(arabicSubject?.id, arabicQuestions)

  // ========== 3. QUESTION ANALYTICS ==========
  console.log("   📈 Creating question analytics...")
  for (const q of createdQuestions) {
    await prisma.questionAnalytics.create({
      data: {
        schoolId,
        questionId: q.id,
        timesUsed: faker.number.int({ min: 5, max: 50 }),
        avgScore: faker.number
          .float({ min: 50, max: 95, fractionDigits: 2 })
          .toString(),
        successRate: faker.number.float({
          min: 40,
          max: 90,
          fractionDigits: 2,
        }),
        avgTimeSpent: faker.number.float({
          min: 2,
          max: 15,
          fractionDigits: 1,
        }),
        lastUsed: faker.date.recent({ days: 30 }),
      },
    })
  }

  // ========== 4. EXAM TEMPLATES ==========
  console.log("   📋 Creating exam templates...")
  const templates: { id: string; subjectId: string }[] = []

  if (mathSubject) {
    const template = await prisma.examTemplate.create({
      data: {
        schoolId,
        name: "Mathematics Mid-Term Template",
        description:
          "Standard mid-term exam with balanced question distribution",
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
    })
    templates.push({ id: template.id, subjectId: mathSubject.id })
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
    })
    templates.push({ id: template.id, subjectId: physicsSubject.id })
  }

  // English Quick Quiz Template
  if (englishSubject) {
    const template = await prisma.examTemplate.create({
      data: {
        schoolId,
        name: "English Quick Quiz Template",
        description: "Short assessment for grammar and vocabulary",
        subjectId: englishSubject.id,
        duration: 30,
        totalMarks: 25,
        distribution: {
          MULTIPLE_CHOICE: { EASY: 5, MEDIUM: 5 },
          TRUE_FALSE: { EASY: 3 },
          FILL_BLANK: { EASY: 3, MEDIUM: 2 },
        },
        bloomDistribution: {
          REMEMBER: 8,
          UNDERSTAND: 5,
          APPLY: 5,
        },
        createdBy: teacherId,
        isActive: true,
      },
    })
    templates.push({ id: template.id, subjectId: englishSubject.id })
  }

  // Biology Lab Assessment Template
  if (biologySubject) {
    const template = await prisma.examTemplate.create({
      data: {
        schoolId,
        name: "Biology Lab Assessment Template",
        description: "Practical exam with theory and application questions",
        subjectId: biologySubject.id,
        duration: 60,
        totalMarks: 40,
        distribution: {
          MULTIPLE_CHOICE: { EASY: 5, MEDIUM: 5 },
          SHORT_ANSWER: { MEDIUM: 3, HARD: 2 },
          ESSAY: { HARD: 1 },
        },
        bloomDistribution: {
          REMEMBER: 5,
          UNDERSTAND: 5,
          APPLY: 4,
          ANALYZE: 3,
        },
        createdBy: teacherId,
        isActive: true,
      },
    })
    templates.push({ id: template.id, subjectId: biologySubject.id })
  }

  // Computer Science Coding Test Template
  if (csSubject) {
    const template = await prisma.examTemplate.create({
      data: {
        schoolId,
        name: "Computer Science Coding Test",
        description: "Programming fundamentals and problem-solving",
        subjectId: csSubject.id,
        duration: 90,
        totalMarks: 50,
        distribution: {
          MULTIPLE_CHOICE: { EASY: 5, MEDIUM: 5 },
          FILL_BLANK: { EASY: 3, MEDIUM: 2 },
          SHORT_ANSWER: { MEDIUM: 3, HARD: 2 },
          ESSAY: { HARD: 1 },
        },
        bloomDistribution: {
          REMEMBER: 5,
          UNDERSTAND: 5,
          APPLY: 8,
          ANALYZE: 2,
        },
        createdBy: teacherId,
        isActive: true,
      },
    })
    templates.push({ id: template.id, subjectId: csSubject.id })
  }

  // History Comprehensive Test Template
  if (historySubject) {
    const template = await prisma.examTemplate.create({
      data: {
        schoolId,
        name: "History Comprehensive Test",
        description: "In-depth assessment covering major historical events",
        subjectId: historySubject.id,
        duration: 75,
        totalMarks: 60,
        distribution: {
          MULTIPLE_CHOICE: { EASY: 10, MEDIUM: 5 },
          TRUE_FALSE: { EASY: 5 },
          FILL_BLANK: { MEDIUM: 5 },
          SHORT_ANSWER: { MEDIUM: 2 },
          ESSAY: { HARD: 2 },
        },
        bloomDistribution: {
          REMEMBER: 10,
          UNDERSTAND: 5,
          ANALYZE: 5,
          EVALUATE: 2,
        },
        createdBy: teacherId,
        isActive: true,
      },
    })
    templates.push({ id: template.id, subjectId: historySubject.id })
  }

  // Arabic Language Assessment Template
  if (arabicSubject) {
    const template = await prisma.examTemplate.create({
      data: {
        schoolId,
        name: "Arabic Language Assessment",
        description: "Grammar, comprehension, and composition",
        subjectId: arabicSubject.id,
        duration: 90,
        totalMarks: 50,
        distribution: {
          MULTIPLE_CHOICE: { EASY: 5, MEDIUM: 5 },
          TRUE_FALSE: { EASY: 5 },
          FILL_BLANK: { MEDIUM: 5 },
          SHORT_ANSWER: { MEDIUM: 3 },
          ESSAY: { HARD: 1 },
        },
        bloomDistribution: {
          REMEMBER: 8,
          UNDERSTAND: 5,
          APPLY: 5,
          CREATE: 2,
        },
        createdBy: teacherId,
        isActive: true,
      },
    })
    templates.push({ id: template.id, subjectId: arabicSubject.id })
  }

  // ========== 5. EXAMS ==========
  console.log("   📝 Creating exams...")
  const exams: {
    id: string
    subjectId: string
    status: ExamStatus
    classId: string
  }[] = []

  // Define exam subjects
  const examSubjects = [
    { subject: mathSubject, name: "Mathematics" },
    { subject: physicsSubject, name: "Physics" },
    { subject: englishSubject, name: "English" },
    { subject: biologySubject, name: "Biology" },
    { subject: chemistrySubject, name: "Chemistry" },
    { subject: csSubject, name: "Computer Science" },
    { subject: historySubject, name: "History" },
    { subject: geographySubject, name: "Geography" },
    { subject: arabicSubject, name: "Arabic Language" },
  ].filter((s) => s.subject)

  for (const { subject, name } of examSubjects) {
    if (!subject) continue

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
        instructions:
          "Answer all questions. Show your work for partial credit.",
      },
    })
    exams.push({
      id: midterm.id,
      subjectId: subject.id,
      status: ExamStatus.COMPLETED,
      classId: classes[0].id,
    })

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
        instructions:
          "This is a comprehensive final exam. Read all instructions carefully.",
      },
    })
    exams.push({
      id: final.id,
      subjectId: subject.id,
      status: ExamStatus.PLANNED,
      classId: classes[0].id,
    })

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
      })
      exams.push({
        id: quiz.id,
        subjectId: subject.id,
        status: ExamStatus.IN_PROGRESS,
        classId: classes[1].id,
      })
    }
  }

  // ========== 6. GENERATED EXAMS (link questions to exams) ==========
  console.log("   🔗 Creating generated exams with questions...")
  const completedExams = exams.filter((e) => e.status === ExamStatus.COMPLETED)

  for (const exam of completedExams) {
    const template = templates.find((t) => t.subjectId === exam.subjectId)
    const examQuestions = createdQuestions.filter(
      (q) => q.subjectId === exam.subjectId
    )

    if (examQuestions.length === 0) continue

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
    })

    // Add questions to the generated exam
    const questionsToAdd = examQuestions.slice(0, 10)
    for (let i = 0; i < questionsToAdd.length; i++) {
      await prisma.generatedExamQuestion.create({
        data: {
          schoolId,
          generatedExamId: generatedExam.id,
          questionId: questionsToAdd[i].id,
          order: i + 1,
          points: questionsToAdd[i].points,
        },
      })
    }
  }

  // ========== 7. RUBRICS FOR ESSAY QUESTIONS ==========
  console.log("   📐 Creating rubrics for essay questions...")
  const essayQuestions = createdQuestions.filter(
    (q) => q.questionType === QuestionType.ESSAY
  )

  for (const question of essayQuestions) {
    const rubric = await prisma.rubric.create({
      data: {
        schoolId,
        questionId: question.id,
        title: "Essay Grading Rubric",
        description: "Standard rubric for evaluating essay responses",
        totalPoints: question.points,
      },
    })

    // Add rubric criteria
    const criteriaData = [
      {
        criterion: "Content & Understanding",
        description: "Demonstrates thorough understanding of concepts",
        maxPoints: question.points * 0.4,
        order: 1,
      },
      {
        criterion: "Organization & Structure",
        description: "Clear introduction, body, and conclusion",
        maxPoints: question.points * 0.2,
        order: 2,
      },
      {
        criterion: "Critical Analysis",
        description: "Shows critical thinking and analysis",
        maxPoints: question.points * 0.25,
        order: 3,
      },
      {
        criterion: "Grammar & Mechanics",
        description: "Proper grammar, spelling, and punctuation",
        maxPoints: question.points * 0.15,
        order: 4,
      },
    ]

    for (const criteria of criteriaData) {
      await prisma.rubricCriterion.create({
        data: {
          schoolId,
          rubricId: rubric.id,
          ...criteria,
        },
      })
    }
  }

  // ========== 8. EXAM RESULTS & STUDENT ANSWERS ==========
  console.log("   ✏️ Creating student answers and exam results...")

  for (const exam of completedExams) {
    const examQuestions = createdQuestions
      .filter((q) => q.subjectId === exam.subjectId)
      .slice(0, 10)

    // Create results for students
    for (let i = 0; i < Math.min(30, students.length); i++) {
      const student = students[i]
      const marks = faker.number.int({ min: 35, max: 98 })
      const percentage = marks
      const grade =
        marks >= 90
          ? "A"
          : marks >= 80
            ? "B"
            : marks >= 70
              ? "C"
              : marks >= 60
                ? "D"
                : "F"

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
          remarks:
            marks >= 80
              ? "Excellent performance"
              : marks >= 60
                ? "Good effort"
                : "Needs improvement",
        },
      })

      // Create student answers and marking results for each question
      for (const question of examQuestions) {
        const autoGradableTypes: QuestionType[] = [
          QuestionType.MULTIPLE_CHOICE,
          QuestionType.TRUE_FALSE,
          QuestionType.FILL_BLANK,
        ]
        const isAutoGradable = autoGradableTypes.includes(question.questionType)
        const gradingMethod = isAutoGradable
          ? GradingMethod.AUTO
          : question.questionType === QuestionType.ESSAY
            ? GradingMethod.AI_ASSISTED
            : GradingMethod.MANUAL

        const studentAnswer = await prisma.studentAnswer.create({
          data: {
            schoolId,
            examId: exam.id,
            questionId: question.id,
            studentId: student.id,
            submissionType: SubmissionType.DIGITAL,
            answerText:
              question.questionType === QuestionType.ESSAY
                ? faker.lorem.paragraphs(2)
                : faker.lorem.sentence(),
            selectedOptionIds:
              question.questionType === QuestionType.MULTIPLE_CHOICE
                ? [String(faker.number.int({ min: 0, max: 3 }))]
                : [],
            submittedAt: new Date(),
          },
        })

        // Create marking result
        const scorePercentage = faker.number.float({
          min: 0.4,
          max: 1.0,
          fractionDigits: 2,
        })
        const pointsAwarded = (question.points * scorePercentage).toFixed(2)

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
            aiScore:
              gradingMethod !== GradingMethod.MANUAL ? pointsAwarded : null,
            aiConfidence:
              gradingMethod !== GradingMethod.MANUAL
                ? faker.number.float({ min: 0.7, max: 0.98, fractionDigits: 2 })
                : null,
            aiReasoning:
              gradingMethod === GradingMethod.AI_ASSISTED
                ? "Response demonstrates good understanding of key concepts."
                : null,
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
        })
      }
    }
  }

  // Summary
  const questionCount = createdQuestions.length
  const examCount = exams.length
  const templateCount = templates.length

  console.log(`   ✅ Created:`)
  console.log(`      - ${questionCount} questions in question bank`)
  console.log(`      - ${templateCount} exam templates`)
  console.log(`      - ${examCount} exams (midterms, finals, quizzes)`)
  console.log(`      - ${essayQuestions.length} rubrics with criteria`)
  console.log(
    `      - ${completedExams.length * Math.min(30, students.length)} exam results`
  )
  console.log(`      - Student answers and marking results\n`)
}
