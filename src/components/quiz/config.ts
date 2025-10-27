// Quiz Module Configuration

import type { QuestionType, DifficultyLevel, BloomLevel, QuizGameType } from "./types";
import type { AchievementDefinition } from "./types";

// ============================================
// Category Options
// ============================================

export const categoryOptions = [
  {
    value: "general_knowledge",
    label: "General Knowledge",
    icon: "🧠",
    color: "#3B82F6",
  },
  {
    value: "mathematics",
    label: "Mathematics",
    icon: "🔢",
    color: "#10B981",
  },
  {
    value: "science",
    label: "Science",
    icon: "🔬",
    color: "#8B5CF6",
  },
  {
    value: "history",
    label: "History",
    icon: "📚",
    color: "#F59E0B",
  },
  {
    value: "geography",
    label: "Geography",
    icon: "🗺️",
    color: "#06B6D4",
  },
  {
    value: "language",
    label: "Language & Literature",
    icon: "📖",
    color: "#EC4899",
  },
  {
    value: "arts",
    label: "Arts & Music",
    icon: "🎨",
    color: "#EF4444",
  },
  {
    value: "technology",
    label: "Technology",
    icon: "💻",
    color: "#6366F1",
  },
  {
    value: "sports",
    label: "Sports & Health",
    icon: "⚽",
    color: "#14B8A6",
  },
  {
    value: "other",
    label: "Other",
    icon: "📝",
    color: "#64748B",
  },
] as const;

// ============================================
// Question Type Options
// ============================================

export const questionTypeOptions: Array<{
  value: QuestionType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: "MULTIPLE_CHOICE",
    label: "Multiple Choice",
    description: "Choose the correct answer from options",
    icon: "☑️",
  },
  {
    value: "TRUE_FALSE",
    label: "True/False",
    description: "Determine if the statement is true or false",
    icon: "✓✗",
  },
  {
    value: "SHORT_ANSWER",
    label: "Short Answer",
    description: "Provide a brief answer (1-2 sentences)",
    icon: "✍️",
  },
  {
    value: "ESSAY",
    label: "Essay",
    description: "Write a detailed response",
    icon: "📝",
  },
  {
    value: "FILL_BLANK",
    label: "Fill in the Blank",
    description: "Complete the sentence with missing words",
    icon: "___",
  },
];

// ============================================
// Difficulty Level Options
// ============================================

export const difficultyOptions: Array<{
  value: DifficultyLevel;
  label: string;
  description: string;
  color: string;
  icon: string;
}> = [
  {
    value: "EASY",
    label: "Easy",
    description: "Basic concepts and recall",
    color: "#10B981",
    icon: "🟢",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    description: "Application and analysis",
    color: "#F59E0B",
    icon: "🟡",
  },
  {
    value: "HARD",
    label: "Hard",
    description: "Complex problem-solving",
    color: "#EF4444",
    icon: "🔴",
  },
];

// ============================================
// Bloom's Taxonomy Levels
// ============================================

export const bloomLevelOptions: Array<{
  value: BloomLevel;
  label: string;
  description: string;
  level: number;
  color: string;
}> = [
  {
    value: "REMEMBER",
    label: "Remember",
    description: "Recall facts and basic concepts",
    level: 1,
    color: "#93C5FD",
  },
  {
    value: "UNDERSTAND",
    label: "Understand",
    description: "Explain ideas and concepts",
    level: 2,
    color: "#60A5FA",
  },
  {
    value: "APPLY",
    label: "Apply",
    description: "Use information in new situations",
    level: 3,
    color: "#3B82F6",
  },
  {
    value: "ANALYZE",
    label: "Analyze",
    description: "Draw connections and patterns",
    level: 4,
    color: "#2563EB",
  },
  {
    value: "EVALUATE",
    label: "Evaluate",
    description: "Justify decisions and choices",
    level: 5,
    color: "#1D4ED8",
  },
  {
    value: "CREATE",
    label: "Create",
    description: "Produce new or original work",
    level: 6,
    color: "#1E40AF",
  },
];

// ============================================
// Game Type Options
// ============================================

export const gameTypeOptions: Array<{
  value: QuizGameType;
  label: string;
  description: string;
  icon: string;
  features: string[];
}> = [
  {
    value: "PRACTICE",
    label: "Practice Mode",
    description: "Self-paced learning with instant feedback",
    icon: "🎯",
    features: ["No time limit", "Instant feedback", "Review answers"],
  },
  {
    value: "TIMED",
    label: "Timed Challenge",
    description: "Race against the clock",
    icon: "⏱️",
    features: ["Time limit", "Scoring multiplier", "Leaderboard"],
  },
  {
    value: "CHALLENGE",
    label: "Competitive Mode",
    description: "Compete with classmates",
    icon: "🏆",
    features: ["Rankings", "Achievements", "Badges"],
  },
  {
    value: "TOURNAMENT",
    label: "Tournament",
    description: "School-wide competition",
    icon: "🥇",
    features: ["Multiple rounds", "Elimination", "Prizes"],
  },
];

// ============================================
// Quiz Settings
// ============================================

export const quizSettings = {
  defaultQuestionCount: 10,
  minQuestionCount: 5,
  maxQuestionCount: 50,
  defaultTimePerQuestion: 60, // seconds
  minTimePerQuestion: 15, // seconds
  maxTimePerQuestion: 300, // seconds (5 minutes)
  pointsPerCorrectAnswer: 10,
  streakBonus: 5, // bonus points per streak
  speedBonusThreshold: 0.5, // 50% of time remaining = bonus
  speedBonusMultiplier: 1.5,
  maxStreak: 100,
  enableKeyboardShortcuts: true,
  enableSoundEffects: true,
  enableHapticFeedback: true,
};

// ============================================
// AI Generation Settings
// ============================================

export const aiSettings = {
  provider: "openai", // "openai" | "anthropic"
  model: "gpt-4-turbo-preview", // or "claude-3-opus"
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: `You are an expert educational content creator. Generate high-quality, accurate, and engaging quiz questions appropriate for the specified difficulty level and Bloom's taxonomy cognitive level.`,
};

// ============================================
// Achievement Definitions
// ============================================

export const achievementDefinitions: AchievementDefinition[] = [
  {
    type: "first_quiz",
    name: "Getting Started",
    description: "Complete your first quiz",
    icon: "🎉",
    points: 10,
    condition: (game) => true, // Always award for first game
  },
  {
    type: "perfect_score",
    name: "Perfect Score",
    description: "Score 100% on a quiz",
    icon: "💯",
    points: 50,
    condition: (game) => (game.percentage ?? 0) === 100,
  },
  {
    type: "speed_demon",
    name: "Speed Demon",
    description: "Complete a quiz in under 5 minutes",
    icon: "⚡",
    points: 30,
    condition: (game) => (game.totalTimeSpent ?? Infinity) < 300,
  },
  {
    type: "marathon_runner",
    name: "Marathon Runner",
    description: "Complete 10 quizzes",
    icon: "🏃",
    points: 100,
    condition: (game, history) => (history?.length ?? 0) >= 10,
  },
  {
    type: "master_mind",
    name: "Master Mind",
    description: "Score above 90% on 5 consecutive quizzes",
    icon: "🧠",
    points: 200,
    condition: (game, history) => {
      const recent = history?.slice(-5) ?? [];
      return (
        recent.length === 5 &&
        recent.every((g) => (g.percentage ?? 0) >= 90)
      );
    },
  },
  {
    type: "comeback_kid",
    name: "Comeback Kid",
    description: "Score 90%+ after scoring below 50%",
    icon: "🔄",
    points: 75,
    condition: (game, history) => {
      const prev = history?.[history.length - 2];
      return (
        (prev?.percentage ?? 100) < 50 && (game.percentage ?? 0) >= 90
      );
    },
  },
  {
    type: "streak_master",
    name: "Streak Master",
    description: "Achieve a streak of 10 correct answers",
    icon: "🔥",
    points: 50,
    condition: (game) => (game.maxStreak ?? 0) >= 10,
  },
  {
    type: "category_expert",
    name: "Category Expert",
    description: "Complete 20 quizzes in the same category",
    icon: "🎓",
    points: 150,
    condition: () => false, // Requires category tracking
  },
  {
    type: "difficulty_master",
    name: "Difficulty Master",
    description: "Score 80%+ on a HARD quiz",
    icon: "💪",
    points: 100,
    condition: (game) =>
      game.difficulty === "HARD" && (game.percentage ?? 0) >= 80,
  },
  {
    type: "bloom_scholar",
    name: "Bloom Scholar",
    description: "Complete quizzes at all Bloom's taxonomy levels",
    icon: "🌸",
    points: 250,
    condition: () => false, // Requires bloom level tracking
  },
];

// ============================================
// Keyboard Shortcuts
// ============================================

export const keyboardShortcuts = {
  selectOption1: "1",
  selectOption2: "2",
  selectOption3: "3",
  selectOption4: "4",
  selectOption5: "5",
  submitAnswer: "Enter",
  nextQuestion: "ArrowRight",
  previousQuestion: "ArrowLeft",
  skipQuestion: "Space",
  pauseTimer: "p",
  quitQuiz: "Escape",
};

// ============================================
// Color Schemes
// ============================================

export const colorSchemes = {
  correct: {
    bg: "#DCFCE7",
    text: "#166534",
    border: "#22C55E",
  },
  incorrect: {
    bg: "#FEE2E2",
    text: "#991B1B",
    border: "#EF4444",
  },
  skipped: {
    bg: "#F3F4F6",
    text: "#4B5563",
    border: "#9CA3AF",
  },
  selected: {
    bg: "#DBEAFE",
    text: "#1E40AF",
    border: "#3B82F6",
  },
};

// ============================================
// Leaderboard Periods
// ============================================

export const leaderboardPeriods = [
  { value: "daily", label: "Today" },
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
  { value: "all_time", label: "All Time" },
] as const;

// ============================================
// Export Default Config
// ============================================

export const defaultQuizConfig = {
  categories: categoryOptions,
  questionTypes: questionTypeOptions,
  difficulties: difficultyOptions,
  bloomLevels: bloomLevelOptions,
  gameTypes: gameTypeOptions,
  settings: quizSettings,
  ai: aiSettings,
  achievements: achievementDefinitions,
  shortcuts: keyboardShortcuts,
  colors: colorSchemes,
  leaderboard: leaderboardPeriods,
};
