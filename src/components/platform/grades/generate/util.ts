import type { BloomLevel } from "@prisma/client";
import { QuestionType, DifficultyLevel } from "@prisma/client";
import type {
  QuestionBankDTO,
  TemplateDistribution,
  BloomDistribution,
  GenerationAlgorithmResult,
  ExamPreviewData,
} from "./types";
import { DEFAULT_TIME_ESTIMATES } from "./config";

// ========== Exam Generation Algorithm ==========

/**
 * Generates an exam by selecting questions based on template distribution
 * Uses a smart selection algorithm that balances randomization with requirements
 */
export function generateExamQuestions(
  availableQuestions: QuestionBankDTO[],
  distribution: TemplateDistribution,
  bloomDistribution?: BloomDistribution,
  isRandomized = false,
  seed?: string
): GenerationAlgorithmResult {
  const selectedQuestions: QuestionBankDTO[] = [];
  const missingCategories: string[] = [];
  const rng = seed ? seededRandom(seed) : Math.random;

  // Group questions by type, difficulty, and Bloom level
  const questionMap = groupQuestionsByCategories(availableQuestions);

  // First pass: Fill distribution requirements
  for (const [questionType, difficulties] of Object.entries(distribution)) {
    for (const [difficulty, count] of Object.entries(difficulties)) {
      if (count === 0) continue;

      const key = `${questionType}-${difficulty}`;
      const availableInCategory = questionMap.get(key) || [];

      if (availableInCategory.length < count) {
        missingCategories.push(
          `${questionType} (${difficulty}): need ${count}, have ${availableInCategory.length}`
        );
      }

      // Select questions from this category
      const selected = selectQuestionsFromCategory(
        availableInCategory,
        count,
        isRandomized,
        rng
      );

      selectedQuestions.push(...selected);

      // Remove selected questions from the pool
      selected.forEach((q) => {
        const idx = availableInCategory.findIndex((aq) => aq.id === q.id);
        if (idx !== -1) availableInCategory.splice(idx, 1);
      });
    }
  }

  // Second pass: Apply Bloom's distribution if specified
  if (bloomDistribution) {
    const bloomAdjusted = applyBloomDistribution(
      selectedQuestions,
      bloomDistribution,
      questionMap,
      rng
    );
    selectedQuestions.length = 0;
    selectedQuestions.push(...bloomAdjusted);
  }

  // Final randomization if requested
  if (isRandomized) {
    shuffleArray(selectedQuestions, rng);
  }

  return {
    selectedQuestions,
    metadata: {
      requestedCount: calculateTotalQuestions(distribution),
      actualCount: selectedQuestions.length,
      distributionMet: missingCategories.length === 0,
      missingCategories,
    },
  };
}

/**
 * Groups questions by type and difficulty for efficient lookup
 */
function groupQuestionsByCategories(
  questions: QuestionBankDTO[]
): Map<string, QuestionBankDTO[]> {
  const map = new Map<string, QuestionBankDTO[]>();

  questions.forEach((q) => {
    const key = `${q.questionType}-${q.difficulty}`;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(q);
  });

  return map;
}

/**
 * Selects questions from a category, prioritizing less-used questions
 */
function selectQuestionsFromCategory(
  questions: QuestionBankDTO[],
  count: number,
  isRandomized: boolean,
  rng: () => number
): QuestionBankDTO[] {
  const available = [...questions];

  if (isRandomized) {
    shuffleArray(available, rng);
  } else {
    // Sort by usage (analytics.timesUsed), prefer less-used questions
    available.sort((a, b) => {
      const aUsage = a.analytics?.timesUsed || 0;
      const bUsage = b.analytics?.timesUsed || 0;
      return aUsage - bUsage;
    });
  }

  return available.slice(0, Math.min(count, available.length));
}

/**
 * Applies Bloom's taxonomy distribution by replacing questions
 */
function applyBloomDistribution(
  currentQuestions: QuestionBankDTO[],
  bloomDistribution: BloomDistribution,
  questionMap: Map<string, QuestionBankDTO[]>,
  rng: () => number
): QuestionBankDTO[] {
  const result: QuestionBankDTO[] = [];
  const used = new Set<string>();

  for (const [bloomLevel, targetCount] of Object.entries(bloomDistribution)) {
    if (targetCount === 0) continue;

    // Find questions at this Bloom level
    const candidatesAtLevel = currentQuestions.filter(
      (q) => q.bloomLevel === bloomLevel && !used.has(q.id)
    );

    const selected = candidatesAtLevel.slice(0, targetCount);
    selected.forEach((q) => {
      result.push(q);
      used.add(q.id);
    });

    // If we don't have enough, keep existing questions
    if (selected.length < targetCount) {
      const remaining = targetCount - selected.length;
      const fallback = currentQuestions
        .filter((q) => !used.has(q.id))
        .slice(0, remaining);

      fallback.forEach((q) => {
        result.push(q);
        used.add(q.id);
      });
    }
  }

  // Add any remaining questions not specified in Bloom distribution
  currentQuestions.forEach((q) => {
    if (!used.has(q.id)) {
      result.push(q);
    }
  });

  return result;
}

// ========== Preview Generation ==========

export function generateExamPreview(
  questions: QuestionBankDTO[]
): ExamPreviewData {
  const distribution = {
    byType: {} as Record<QuestionType, number>,
    byDifficulty: {} as Record<DifficultyLevel, number>,
    byBloom: {} as Record<BloomLevel, number>,
  };

  let totalMarks = 0;
  let estimatedDuration = 0;

  questions.forEach((q, index) => {
    // Count distributions
    distribution.byType[q.questionType] =
      (distribution.byType[q.questionType] || 0) + 1;
    distribution.byDifficulty[q.difficulty] =
      (distribution.byDifficulty[q.difficulty] || 0) + 1;
    distribution.byBloom[q.bloomLevel] =
      (distribution.byBloom[q.bloomLevel] || 0) + 1;

    // Calculate totals
    totalMarks += Number(q.points);
    estimatedDuration +=
      q.timeEstimate || DEFAULT_TIME_ESTIMATES[q.questionType];
  });

  return {
    totalQuestions: questions.length,
    totalMarks,
    estimatedDuration: Math.ceil(estimatedDuration),
    distribution,
    questions: questions.map((q, index) => ({
      id: q.id,
      order: index + 1,
      questionText: q.questionText,
      type: q.questionType,
      difficulty: q.difficulty,
      bloomLevel: q.bloomLevel,
      points: Number(q.points),
    })),
  };
}

// ========== Distribution Helpers ==========

export function calculateTotalQuestions(
  distribution: TemplateDistribution
): number {
  return Object.values(distribution).reduce(
    (total, difficulties) =>
      total + Object.values(difficulties).reduce((sum, count) => sum + count, 0),
    0
  );
}

export function calculateTotalMarksFromDistribution(
  distribution: TemplateDistribution
): number {
  let total = 0;

  for (const [questionType, difficulties] of Object.entries(distribution)) {
    for (const [difficulty, count] of Object.entries(difficulties)) {
      const basePoints = getDefaultPointsForQuestion(
        questionType as QuestionType,
        difficulty as DifficultyLevel
      );
      total += basePoints * count;
    }
  }

  return total;
}

function getDefaultPointsForQuestion(
  type: QuestionType,
  difficulty: DifficultyLevel
): number {
  const basePoints = {
    [QuestionType.MULTIPLE_CHOICE]: 1,
    [QuestionType.TRUE_FALSE]: 1,
    [QuestionType.FILL_BLANK]: 2,
    [QuestionType.SHORT_ANSWER]: 3,
    [QuestionType.ESSAY]: 5,
  }[type];

  const multiplier = {
    [DifficultyLevel.EASY]: 1,
    [DifficultyLevel.MEDIUM]: 1.5,
    [DifficultyLevel.HARD]: 2,
  }[difficulty];

  return Math.round(basePoints * multiplier);
}

export function validateDistributionAgainstAvailable(
  distribution: TemplateDistribution,
  availableQuestions: QuestionBankDTO[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const questionMap = groupQuestionsByCategories(availableQuestions);

  for (const [questionType, difficulties] of Object.entries(distribution)) {
    for (const [difficulty, count] of Object.entries(difficulties)) {
      if (count === 0) continue;

      const key = `${questionType}-${difficulty}`;
      const available = questionMap.get(key) || [];

      if (available.length < count) {
        errors.push(
          `Not enough ${questionType} (${difficulty}) questions: need ${count}, have ${available.length}`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ========== Randomization Utilities ==========

/**
 * Seeded random number generator for reproducible randomization
 */
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return function () {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[], rng: () => number = Math.random): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function generateRandomSeed(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

// ========== Analytics Utilities ==========

export function calculatePerceivedDifficulty(
  successRate: number
): DifficultyLevel {
  if (successRate >= 80) return DifficultyLevel.EASY;
  if (successRate >= 50) return DifficultyLevel.MEDIUM;
  return DifficultyLevel.HARD;
}

export function calculateSuccessRate(
  avgScore: number,
  maxPoints: number
): number {
  if (maxPoints === 0) return 0;
  return (avgScore / maxPoints) * 100;
}

export function shouldRecommendDifficultyChange(
  assignedDifficulty: DifficultyLevel,
  perceivedDifficulty: DifficultyLevel,
  timesUsed: number
): boolean {
  // Only recommend if used enough times and there's a mismatch
  return timesUsed >= 5 && assignedDifficulty !== perceivedDifficulty;
}

// ========== Tag Utilities ==========

export function extractTagsFromText(text: string): string[] {
  // Extract common educational tags from question text
  const commonTopics = [
    "algebra",
    "geometry",
    "calculus",
    "physics",
    "chemistry",
    "biology",
    "history",
    "geography",
    "grammar",
    "literature",
    "programming",
    "database",
    "algorithm",
  ];

  const textLower = text.toLowerCase();
  return commonTopics.filter((topic) => textLower.includes(topic));
}

export function normalizeTags(tags: string[]): string[] {
  return tags.map((tag) => tag.toLowerCase().trim()).filter(Boolean);
}

// ========== Export Utilities ==========

export function exportQuestionsToCSV(questions: QuestionBankDTO[]): string {
  const headers = [
    "Question Text",
    "Type",
    "Difficulty",
    "Bloom Level",
    "Points",
    "Tags",
  ];

  const rows = questions.map((q) => [
    `"${q.questionText.replace(/"/g, '""')}"`,
    q.questionType,
    q.difficulty,
    q.bloomLevel,
    q.points,
    `"${q.tags.join(", ")}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function exportExamToJSON(
  questions: QuestionBankDTO[],
  metadata: Record<string, unknown>
): string {
  return JSON.stringify(
    {
      metadata,
      questions: questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        type: q.questionType,
        difficulty: q.difficulty,
        bloomLevel: q.bloomLevel,
        points: q.points,
        options: q.options,
        tags: q.tags,
      })),
    },
    null,
    2
  );
}
