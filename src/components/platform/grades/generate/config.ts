import {
  BloomLevel,
  DifficultyLevel,
  QuestionSource,
  QuestionType,
} from "@prisma/client";

// Question Types Configuration
export const QUESTION_TYPES = [
  {
    label: "Multiple Choice",
    value: QuestionType.MULTIPLE_CHOICE,
    description: "Questions with multiple options, one or more correct answers",
    icon: "CircleDot",
    supportsAutoGrading: true,
  },
  {
    label: "True/False",
    value: QuestionType.TRUE_FALSE,
    description: "Binary choice questions",
    icon: "ToggleLeft",
    supportsAutoGrading: true,
  },
  {
    label: "Fill in the Blank",
    value: QuestionType.FILL_BLANK,
    description: "Short answer questions with specific expected answers",
    icon: "Type",
    supportsAutoGrading: true,
  },
  {
    label: "Short Answer",
    value: QuestionType.SHORT_ANSWER,
    description: "1-2 sentence responses requiring manual or AI grading",
    icon: "FileText",
    supportsAutoGrading: false,
  },
  {
    label: "Essay",
    value: QuestionType.ESSAY,
    description: "Long-form answers requiring manual or AI grading",
    icon: "BookOpen",
    supportsAutoGrading: false,
  },
] as const;

// Difficulty Levels Configuration
export const DIFFICULTY_LEVELS = [
  {
    label: "Easy",
    value: DifficultyLevel.EASY,
    description: "Basic recall and understanding questions",
    color: "green" as const,
    points: 1,
  },
  {
    label: "Medium",
    value: DifficultyLevel.MEDIUM,
    description: "Application and analysis questions",
    color: "yellow" as const,
    points: 2,
  },
  {
    label: "Hard",
    value: DifficultyLevel.HARD,
    description: "Evaluation and creation questions",
    color: "red" as const,
    points: 3,
  },
] as const;

// Bloom's Taxonomy Levels Configuration
export const BLOOM_LEVELS = [
  {
    label: "Remember",
    value: BloomLevel.REMEMBER,
    level: 1,
    description: "Recall facts and basic concepts",
    examples: [
      "Define...",
      "List...",
      "Identify...",
      "Name...",
      "State...",
    ],
    color: "#E3F2FD" as const,
  },
  {
    label: "Understand",
    value: BloomLevel.UNDERSTAND,
    level: 2,
    description: "Explain ideas or concepts",
    examples: [
      "Explain...",
      "Describe...",
      "Summarize...",
      "Interpret...",
      "Compare...",
    ],
    color: "#BBDEFB" as const,
  },
  {
    label: "Apply",
    value: BloomLevel.APPLY,
    level: 3,
    description: "Use information in new situations",
    examples: [
      "Apply...",
      "Solve...",
      "Use...",
      "Demonstrate...",
      "Calculate...",
    ],
    color: "#90CAF9" as const,
  },
  {
    label: "Analyze",
    value: BloomLevel.ANALYZE,
    level: 4,
    description: "Draw connections among ideas",
    examples: [
      "Analyze...",
      "Compare...",
      "Contrast...",
      "Examine...",
      "Categorize...",
    ],
    color: "#64B5F6" as const,
  },
  {
    label: "Evaluate",
    value: BloomLevel.EVALUATE,
    level: 5,
    description: "Justify a stand or decision",
    examples: [
      "Evaluate...",
      "Justify...",
      "Critique...",
      "Judge...",
      "Defend...",
    ],
    color: "#42A5F5" as const,
  },
  {
    label: "Create",
    value: BloomLevel.CREATE,
    level: 6,
    description: "Produce new or original work",
    examples: [
      "Create...",
      "Design...",
      "Construct...",
      "Develop...",
      "Formulate...",
    ],
    color: "#2196F3" as const,
  },
] as const;

// Question Source Configuration
export const QUESTION_SOURCES = [
  {
    label: "Manual",
    value: QuestionSource.MANUAL,
    description: "Created manually by teacher",
    icon: "User",
  },
  {
    label: "AI Generated",
    value: QuestionSource.AI,
    description: "Generated using AI",
    icon: "Sparkles",
  },
  {
    label: "Imported",
    value: QuestionSource.IMPORTED,
    description: "Imported from external source",
    icon: "Upload",
  },
] as const;

// Default Points by Difficulty
export const DEFAULT_POINTS_BY_DIFFICULTY = {
  [DifficultyLevel.EASY]: 1,
  [DifficultyLevel.MEDIUM]: 2,
  [DifficultyLevel.HARD]: 3,
} as const;

// Default Points by Question Type
export const DEFAULT_POINTS_BY_TYPE = {
  [QuestionType.MULTIPLE_CHOICE]: 1,
  [QuestionType.TRUE_FALSE]: 1,
  [QuestionType.FILL_BLANK]: 2,
  [QuestionType.SHORT_ANSWER]: 3,
  [QuestionType.ESSAY]: 5,
} as const;

// Time Estimates (in minutes)
export const DEFAULT_TIME_ESTIMATES = {
  [QuestionType.MULTIPLE_CHOICE]: 1.5,
  [QuestionType.TRUE_FALSE]: 0.5,
  [QuestionType.FILL_BLANK]: 2,
  [QuestionType.SHORT_ANSWER]: 5,
  [QuestionType.ESSAY]: 15,
} as const;

// Template Distribution Defaults
export const DEFAULT_TEMPLATE_DISTRIBUTION = {
  [QuestionType.MULTIPLE_CHOICE]: {
    [DifficultyLevel.EASY]: 5,
    [DifficultyLevel.MEDIUM]: 3,
    [DifficultyLevel.HARD]: 2,
  },
  [QuestionType.TRUE_FALSE]: {
    [DifficultyLevel.EASY]: 3,
    [DifficultyLevel.MEDIUM]: 2,
    [DifficultyLevel.HARD]: 0,
  },
} as const;

// Template Bloom Distribution Defaults
export const DEFAULT_BLOOM_DISTRIBUTION = {
  [BloomLevel.REMEMBER]: 4,
  [BloomLevel.UNDERSTAND]: 3,
  [BloomLevel.APPLY]: 2,
  [BloomLevel.ANALYZE]: 1,
  [BloomLevel.EVALUATE]: 0,
  [BloomLevel.CREATE]: 0,
} as const;

// AI Generation Prompts
export const AI_GENERATION_PROMPTS = {
  contextTemplate: `You are an expert educator creating exam questions for {subject} at {level} level.

Topic: {topic}
Difficulty: {difficulty}
Bloom's Level: {bloomLevel}

Generate a {questionType} question that:
- Tests {bloomLevel} level thinking
- Is appropriate for {difficulty} difficulty
- Focuses on {topic}
- Is clear and unambiguous
{additionalInstructions}`,

  mcqFormat: `
Return the question in this exact JSON format:
{
  "questionText": "The question text here",
  "options": [
    {"text": "Option 1", "isCorrect": false, "explanation": "Why this is wrong"},
    {"text": "Option 2", "isCorrect": true, "explanation": "Why this is correct"},
    {"text": "Option 3", "isCorrect": false, "explanation": "Why this is wrong"},
    {"text": "Option 4", "isCorrect": false, "explanation": "Why this is wrong"}
  ],
  "explanation": "Detailed explanation of the concept"
}`,

  trueFalseFormat: `
Return the question in this exact JSON format:
{
  "questionText": "The statement to evaluate",
  "options": [
    {"text": "True", "isCorrect": true, "explanation": "Explanation if true"},
    {"text": "False", "isCorrect": false, "explanation": "Explanation if false"}
  ],
  "explanation": "Detailed explanation"
}`,

  fillBlankFormat: `
Return the question in this exact JSON format:
{
  "questionText": "The question with a _____ blank",
  "acceptedAnswers": ["answer1", "answer2", "synonym"],
  "caseSensitive": false,
  "explanation": "Detailed explanation"
}`,

  shortAnswerFormat: `
Return the question in this exact JSON format:
{
  "questionText": "The question here",
  "sampleAnswer": "A good sample answer showing key points",
  "gradingRubric": "Key points that should be included: 1)..., 2)..., 3)...",
  "explanation": "Detailed explanation of the concept"
}`,

  essayFormat: `
Return the question in this exact JSON format:
{
  "questionText": "The essay prompt here",
  "sampleAnswer": "A comprehensive sample answer",
  "gradingRubric": "Rubric with criteria: Structure (20%), Content (40%), Analysis (30%), Conclusion (10%)",
  "explanation": "What the essay should address"
}`,
} as const;

// Exam Generation Settings
export const EXAM_GENERATION_SETTINGS = {
  minQuestionsPerExam: 1,
  maxQuestionsPerExam: 100,
  defaultDuration: 60, // minutes
  minDuration: 15,
  maxDuration: 480, // 8 hours
  allowDuplicateQuestions: false,
  defaultRandomization: false,
} as const;

// Analytics Settings
export const ANALYTICS_SETTINGS = {
  minUsesForReliableStats: 3,
  successRateThresholds: {
    low: 50, // Below 50% = too hard
    high: 90, // Above 90% = too easy
  },
  perceivedDifficultyMapping: {
    [DifficultyLevel.EASY]: { min: 80, max: 100 },
    [DifficultyLevel.MEDIUM]: { min: 50, max: 79 },
    [DifficultyLevel.HARD]: { min: 0, max: 49 },
  },
} as const;

// Helper Functions
export function getQuestionTypeConfig(type: QuestionType) {
  return QUESTION_TYPES.find((qt) => qt.value === type);
}

export function getDifficultyLevelConfig(difficulty: DifficultyLevel) {
  return DIFFICULTY_LEVELS.find((dl) => dl.value === difficulty);
}

export function getBloomLevelConfig(bloomLevel: BloomLevel) {
  return BLOOM_LEVELS.find((bl) => bl.value === bloomLevel);
}

export function getQuestionSourceConfig(source: QuestionSource) {
  return QUESTION_SOURCES.find((qs) => qs.value === source);
}

export function calculateDefaultPoints(
  type: QuestionType,
  difficulty: DifficultyLevel
) {
  const basePoints = DEFAULT_POINTS_BY_TYPE[type];
  const difficultyMultiplier =
    difficulty === DifficultyLevel.EASY
      ? 1
      : difficulty === DifficultyLevel.MEDIUM
        ? 1.5
        : 2;
  return Math.round(basePoints * difficultyMultiplier);
}

export function estimateExamDuration(questions: {
  questionType: QuestionType;
  difficulty: DifficultyLevel;
}[]) {
  return questions.reduce((total, q) => {
    const baseTime = DEFAULT_TIME_ESTIMATES[q.questionType];
    const difficultyMultiplier =
      q.difficulty === DifficultyLevel.EASY
        ? 1
        : q.difficulty === DifficultyLevel.MEDIUM
          ? 1.2
          : 1.5;
    return total + baseTime * difficultyMultiplier;
  }, 0);
}
