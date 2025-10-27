// Quiz Scoring Algorithms

import type {
  QuizGame,
  QuizGameQuestion,
  QuizResultSummary,
  QuestionResult,
} from "../types";
import { quizSettings, achievementDefinitions } from "../config";
import { calculateStreak } from "./utils";

// ============================================
// Score Calculation
// ============================================

/**
 * Calculate base score for a correct answer
 */
export function calculateBaseScore(
  isCorrect: boolean,
  points: number
): number {
  return isCorrect ? points : 0;
}

/**
 * Calculate time bonus based on speed
 */
export function calculateTimeBonus(
  timeSpent: number,
  timeLimit: number
): number {
  if (!timeLimit || timeSpent >= timeLimit) return 0;

  const timeRemaining = timeLimit - timeSpent;
  const percentageRemaining = timeRemaining / timeLimit;

  // Award bonus if answered in less than half the time
  if (percentageRemaining >= quizSettings.speedBonusThreshold) {
    return quizSettings.pointsPerCorrectAnswer * (quizSettings.speedBonusMultiplier - 1);
  }

  return 0;
}

/**
 * Calculate streak bonus
 */
export function calculateStreakBonus(currentStreak: number): number {
  if (currentStreak < 3) return 0;
  return Math.min(
    currentStreak * quizSettings.streakBonus,
    quizSettings.maxStreak * quizSettings.streakBonus
  );
}

/**
 * Calculate difficulty multiplier
 */
export function getDifficultyMultiplier(difficulty: string): number {
  const multipliers: Record<string, number> = {
    EASY: 1.0,
    MEDIUM: 1.5,
    HARD: 2.0,
  };
  return multipliers[difficulty] || 1.0;
}

/**
 * Calculate Bloom's level multiplier
 */
export function getBloomMultiplier(bloomLevel: string): number {
  const multipliers: Record<string, number> = {
    REMEMBER: 1.0,
    UNDERSTAND: 1.2,
    APPLY: 1.4,
    ANALYZE: 1.6,
    EVALUATE: 1.8,
    CREATE: 2.0,
  };
  return multipliers[bloomLevel] || 1.0;
}

/**
 * Calculate total points for a question
 */
export function calculateQuestionScore(params: {
  isCorrect: boolean;
  basePoints: number;
  difficulty?: string;
  bloomLevel?: string;
  timeSpent?: number;
  timeLimit?: number;
  currentStreak?: number;
}): number {
  const {
    isCorrect,
    basePoints,
    difficulty,
    bloomLevel,
    timeSpent,
    timeLimit,
    currentStreak = 0,
  } = params;

  if (!isCorrect) return 0;

  let score = basePoints;

  // Apply difficulty multiplier
  if (difficulty) {
    score *= getDifficultyMultiplier(difficulty);
  }

  // Apply Bloom's level multiplier
  if (bloomLevel) {
    score *= getBloomMultiplier(bloomLevel);
  }

  // Add time bonus
  if (timeSpent !== undefined && timeLimit) {
    score += calculateTimeBonus(timeSpent, timeLimit);
  }

  // Add streak bonus
  if (currentStreak > 0) {
    score += calculateStreakBonus(currentStreak);
  }

  return Math.round(score);
}

// ============================================
// Game Results Calculation
// ============================================

/**
 * Calculate complete quiz result summary
 */
export function calculateQuizResults(
  game: QuizGame,
  questions: QuizGameQuestion[]
): QuizResultSummary {
  const correctAnswers = questions.filter((q) => q.isCorrect === true).length;
  const wrongAnswers = questions.filter((q) => q.isCorrect === false).length;
  const skippedAnswers = questions.filter((q) => q.isSkipped).length;

  const totalScore = questions.reduce(
    (sum, q) => sum + Number(q.pointsEarned || 0),
    0
  );
  const maxScore = questions.reduce(
    (sum, q) => sum + Number(q.maxPoints || 0),
    0
  );

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  const totalTimeSpent = questions.reduce(
    (sum, q) => sum + (q.timeSpent || 0),
    0
  );
  const averageTimePerQuestion =
    questions.length > 0 ? totalTimeSpent / questions.length : 0;

  const accuracy =
    questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;

  // Calculate streaks
  const isCorrectArray = questions.map((q) => q.isCorrect === true);
  const { current: currentStreakValue, max: maxStreakValue } =
    calculateStreak(isCorrectArray);

  return {
    gameId: game.id,
    totalQuestions: game.totalQuestions,
    correctAnswers,
    wrongAnswers,
    skippedAnswers,
    score: totalScore,
    maxScore,
    percentage,
    timeSpent: totalTimeSpent,
    averageTimePerQuestion,
    accuracy,
    streak: currentStreakValue,
    maxStreak: maxStreakValue,
    pointsEarned: game.pointsEarned || 0,
    badgesEarned: game.badgesEarned || [],
  };
}

/**
 * Generate detailed question results
 */
export function generateQuestionResults(
  questions: (QuizGameQuestion & { question: any })[]
): QuestionResult[] {
  return questions.map((q) => ({
    questionId: q.questionId,
    questionText: q.question.questionText,
    questionType: q.question.questionType,
    difficulty: q.question.difficulty,
    userAnswer: q.userAnswer || null,
    correctAnswer: getCorrectAnswer(q.question),
    isCorrect: q.isCorrect || false,
    isSkipped: q.isSkipped,
    timeSpent: q.timeSpent || 0,
    points: Number(q.pointsEarned || 0),
    maxPoints: Number(q.maxPoints || 0),
    feedback: q.feedback || undefined,
    explanation: q.question.explanation || undefined,
  }));
}

// ============================================
// Achievement Checking
// ============================================

/**
 * Check which achievements were earned
 */
export function checkAchievements(
  game: QuizGame,
  history?: QuizGame[]
): string[] {
  const earned: string[] = [];

  for (const achievement of achievementDefinitions) {
    if (achievement.condition(game, history)) {
      earned.push(achievement.type);
    }
  }

  return earned;
}

/**
 * Calculate total points from achievements
 */
export function calculateAchievementPoints(achievementTypes: string[]): number {
  let total = 0;
  for (const type of achievementTypes) {
    const achievement = achievementDefinitions.find((a) => a.type === type);
    if (achievement) {
      total += achievement.points;
    }
  }
  return total;
}

// ============================================
// Ranking Calculation
// ============================================

/**
 * Calculate user rank based on scores
 */
export function calculateRank(
  userScore: number,
  allScores: number[]
): number {
  const sortedScores = [...allScores].sort((a, b) => b - a);
  const rank = sortedScores.indexOf(userScore) + 1;
  return rank > 0 ? rank : allScores.length + 1;
}

/**
 * Calculate percentile
 */
export function calculatePercentile(
  userScore: number,
  allScores: number[]
): number {
  const lowerScores = allScores.filter((score) => score < userScore).length;
  return allScores.length > 0 ? (lowerScores / allScores.length) * 100 : 0;
}

// ============================================
// Progress Calculation
// ============================================

/**
 * Calculate progress towards next achievement
 */
export function calculateAchievementProgress(
  achievementType: string,
  currentValue: number
): { current: number; target: number; percentage: number } {
  const targets: Record<string, number> = {
    first_quiz: 1,
    perfect_score: 1,
    speed_demon: 1,
    marathon_runner: 10,
    master_mind: 5,
    comeback_kid: 1,
    streak_master: 10,
    category_expert: 20,
    difficulty_master: 1,
    bloom_scholar: 6,
  };

  const target = targets[achievementType] || 1;
  const percentage = Math.min((currentValue / target) * 100, 100);

  return {
    current: currentValue,
    target,
    percentage,
  };
}

/**
 * Calculate mastery level (beginner, intermediate, advanced, expert)
 */
export function calculateMasteryLevel(
  totalGames: number,
  averageScore: number
): {
  level: string;
  progress: number;
  nextLevel: string;
} {
  const levels = [
    { name: "Beginner", minGames: 0, minScore: 0 },
    { name: "Intermediate", minGames: 5, minScore: 60 },
    { name: "Advanced", minGames: 15, minScore: 75 },
    { name: "Expert", minGames: 30, minScore: 85 },
    { name: "Master", minGames: 50, minScore: 90 },
  ];

  let currentLevel = levels[0];
  let nextLevel = levels[1];

  for (let i = 0; i < levels.length; i++) {
    if (
      totalGames >= levels[i].minGames &&
      averageScore >= levels[i].minScore
    ) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || levels[i];
    }
  }

  // Calculate progress to next level
  const gamesProgress =
    ((totalGames - currentLevel.minGames) /
      (nextLevel.minGames - currentLevel.minGames)) *
    50;
  const scoreProgress =
    ((averageScore - currentLevel.minScore) /
      (nextLevel.minScore - currentLevel.minScore)) *
    50;

  const progress = Math.min(gamesProgress + scoreProgress, 100);

  return {
    level: currentLevel.name,
    progress: isNaN(progress) ? 100 : progress,
    nextLevel: nextLevel.name,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Extract correct answer from question data
 */
function getCorrectAnswer(question: any): string {
  if (typeof question.options === "string") {
    try {
      const options = JSON.parse(question.options);
      if (Array.isArray(options)) {
        const correct = options.find((opt: any) => opt.isCorrect);
        return correct?.text || "";
      }
    } catch {
      // Fall through to sampleAnswer
    }
  }

  if (Array.isArray(question.options)) {
    const correct = question.options.find((opt: any) => opt.isCorrect);
    return correct?.text || "";
  }

  return question.sampleAnswer || "";
}

/**
 * Calculate improvement rate between two scores
 */
export function calculateImprovement(
  previousScore: number,
  currentScore: number
): { percentage: number; direction: "up" | "down" | "same" } {
  if (previousScore === 0) {
    return { percentage: 100, direction: "up" };
  }

  const diff = currentScore - previousScore;
  const percentage = Math.abs((diff / previousScore) * 100);

  return {
    percentage,
    direction: diff > 0 ? "up" : diff < 0 ? "down" : "same",
  };
}

/**
 * Calculate weighted average score
 */
export function calculateWeightedAverage(
  scores: Array<{ score: number; weight: number }>
): number {
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = scores.reduce(
    (sum, s) => sum + s.score * s.weight,
    0
  );
  return weightedSum / totalWeight;
}

/**
 * Generate performance insights
 */
export function generatePerformanceInsights(
  results: QuizResultSummary
): string[] {
  const insights: string[] = [];

  // Score insights
  if (results.percentage >= 90) {
    insights.push("Excellent performance! You've mastered this topic.");
  } else if (results.percentage >= 70) {
    insights.push("Good job! You have a solid understanding.");
  } else if (results.percentage >= 50) {
    insights.push("Not bad, but there's room for improvement.");
  } else {
    insights.push("Consider reviewing the material before trying again.");
  }

  // Speed insights
  if (results.averageTimePerQuestion < 30) {
    insights.push("You answered questions quickly!");
  } else if (results.averageTimePerQuestion > 120) {
    insights.push("Take your time, but try to improve your speed.");
  }

  // Streak insights
  if (results.maxStreak >= 10) {
    insights.push(`Amazing! You achieved a ${results.maxStreak}-question streak.`);
  } else if (results.maxStreak >= 5) {
    insights.push("Great focus! You had a nice streak going.");
  }

  // Accuracy insights
  if (results.accuracy >= 90) {
    insights.push("Your accuracy is outstanding!");
  } else if (results.accuracy < 50) {
    insights.push("Focus on accuracy over speed for better results.");
  }

  return insights;
}
