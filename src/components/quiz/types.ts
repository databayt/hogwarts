// Quiz Module Types

import type { Locale } from "@/components/internationalization/config";
import type {
  QuizGame,
  QuizGameQuestion,
  QuizCategory,
  QuizCategoryStats,
  QuizAchievement,
  QuizLeaderboard,
  QuestionBank,
  QuestionType,
  DifficultyLevel,
  BloomLevel,
  QuizGameType,
  QuizGameStatus,
} from "@prisma/client";

// ============================================
// Core Quiz Types
// ============================================

export type {
  QuestionType,
  DifficultyLevel,
  BloomLevel,
  QuizGameType,
  QuizGameStatus,
};

// ============================================
// Extended Types with Relations
// ============================================

export type QuizGameWithDetails = QuizGame & {
  questions: QuizGameQuestionWithDetails[];
  user?: {
    id: string;
    username: string | null;
    image: string | null;
  };
};

export type QuizGameQuestionWithDetails = QuizGameQuestion & {
  question: QuestionBank;
};

export type QuestionBankWithOptions = QuestionBank & {
  options: QuestionOption[];
};

export type QuizCategoryWithStats = QuizCategory & {
  stats?: QuizCategoryStats | null;
  _count?: {
    stats: number;
  };
};

// ============================================
// Question Option Types
// ============================================

export interface QuestionOption {
  id?: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface FillBlankConfig {
  acceptedAnswers: string[];
  caseSensitive: boolean;
}

// ============================================
// Quiz Configuration Types
// ============================================

export interface QuizConfig {
  topic: string;
  gameType: QuizGameType;
  questionType?: QuestionType | null;
  difficulty?: DifficultyLevel | null;
  bloomLevel?: BloomLevel | null;
  totalQuestions: number;
  timeLimitMinutes?: number | null;
  aiGenerated: boolean;
}

export interface QuizSetup {
  questionCount: number;
  category: string | null;
  difficulty: DifficultyLevel | null;
  bloomLevel?: BloomLevel | null;
  timeLimit?: number | null;
}

// ============================================
// Quiz Game State Types
// ============================================

export interface QuizGameState {
  currentQuestionIndex: number;
  answers: Map<string, QuizAnswer>;
  timeStarted: Date;
  timeElapsed: number;
  isComplete: boolean;
  score: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
}

export interface QuizAnswer {
  questionId: string;
  userAnswer: string | null;
  selectedOptions: string[];
  isCorrect: boolean | null;
  isSkipped: boolean;
  timeSpent: number;
  feedback?: string;
}

// ============================================
// Quiz Results Types
// ============================================

export interface QuizResultSummary {
  gameId: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number;
  averageTimePerQuestion: number;
  accuracy: number;
  streak: number;
  maxStreak: number;
  pointsEarned: number;
  badgesEarned: string[];
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean | null;
  isSkipped: boolean;
  timeSpent: number;
  points: number;
  maxPoints: number;
  feedback?: string;
  explanation?: string;
}

// ============================================
// AI Generation Types
// ============================================

export interface AIQuestionGenerationRequest {
  topic: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  count: number;
  bloomLevel?: BloomLevel;
  subjectId?: string;
}

export interface AIGeneratedQuestion {
  questionText: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  bloomLevel: BloomLevel;
  options?: QuestionOption[];
  correctAnswer?: string;
  sampleAnswer?: string;
  explanation?: string;
  tags: string[];
}

export interface AIGradingResult {
  score: number;
  maxScore: number;
  percentage: number;
  feedback: string;
  suggestions?: string[];
  isCorrect: boolean;
}

// ============================================
// Statistics Types
// ============================================

export interface QuizStatistics {
  totalGames: number;
  completedGames: number;
  averageScore: number;
  bestScore: number;
  totalTimeSpent: number;
  averageTimePerGame: number;
  accuracyRate: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  rank?: number;
  classRank?: number;
}

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  attempts: number;
  completed: number;
  averageScore: number;
  bestScore: number;
  successRate: number;
  lastAttempt?: Date;
}

export interface QuestionAnalytics {
  questionId: string;
  timesUsed: number;
  avgScore: number;
  successRate: number;
  avgTimeSpent: number;
  perceivedDifficulty?: DifficultyLevel;
}

// ============================================
// Leaderboard Types
// ============================================

export interface LeaderboardEntry {
  userId: string;
  username: string;
  image: string | null;
  totalGames: number;
  totalScore: number;
  averageScore: number;
  rank: number;
  classRank?: number;
}

export type LeaderboardPeriod = "daily" | "weekly" | "monthly" | "all_time";

// ============================================
// Achievement/Gamification Types
// ============================================

export type AchievementType =
  | "first_quiz"
  | "perfect_score"
  | "speed_demon"
  | "marathon_runner"
  | "master_mind"
  | "comeback_kid"
  | "streak_master"
  | "category_expert"
  | "difficulty_master"
  | "bloom_scholar";

export interface AchievementDefinition {
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  points: number;
  condition: (game: QuizGame, history?: QuizGame[]) => boolean;
}

// ============================================
// Form Types
// ============================================

export interface QuizCreationFormData {
  topic: string;
  gameType: QuizGameType;
  questionType?: QuestionType;
  difficulty?: DifficultyLevel;
  bloomLevel?: BloomLevel;
  totalQuestions: number;
  timeLimitMinutes?: number;
  aiGenerated: boolean;
  categoryId?: string;
  subjectId?: string;
}

export interface QuizFilterOptions {
  gameType?: QuizGameType;
  status?: QuizGameStatus;
  difficulty?: DifficultyLevel;
  dateFrom?: Date;
  dateTo?: Date;
  categoryId?: string;
}

// ============================================
// Component Props Types
// ============================================

export interface QuizDashboardProps {
  locale: Locale;
  schoolId: string;
  userId: string;
}

export interface QuizGameProps {
  gameId: string;
  locale: Locale;
}

export interface QuizResultsProps {
  gameId: string;
  locale: Locale;
}

export interface QuizStatisticsProps {
  gameId?: string;
  userId?: string;
  locale: Locale;
}

// ============================================
// Server Action Response Types
// ============================================

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export type CreateQuizGameResult = ActionResult<{ gameId: string }>;
export type SubmitAnswerResult = ActionResult<{
  isCorrect: boolean;
  feedback?: string;
}>;
export type CompleteQuizResult = ActionResult<QuizResultSummary>;
export type GenerateQuestionsResult = ActionResult<AIGeneratedQuestion[]>;
