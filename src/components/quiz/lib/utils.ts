// Quiz Utility Functions

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  QuizGame,
  QuestionType,
  DifficultyLevel,
  BloomLevel,
} from "../types";

// ============================================
// Class Name Utilities
// ============================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// Time Formatting
// ============================================

/**
 * Format seconds into a readable time string (e.g., "2h 15m 30s")
 */
export function formatTimeDelta(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - hours * 3600) / 60);
  const secs = Math.floor(seconds - hours * 3600 - minutes * 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.length > 0 ? parts.join(" ") : "0s";
}

/**
 * Format seconds into MM:SS format
 */
export function formatTimeMMSS(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Calculate time difference in seconds between two dates
 */
export function getTimeDifferenceInSeconds(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 1000);
}

// ============================================
// Score Formatting
// ============================================

/**
 * Format score as percentage with specified decimal places
 */
export function formatPercentage(
  value: number,
  decimals: number = 1
): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format score display (e.g., "15/20" or "75%")
 */
export function formatScore(
  score: number,
  maxScore: number,
  showPercentage: boolean = false
): string {
  if (showPercentage) {
    const percentage = (score / maxScore) * 100;
    return formatPercentage(percentage);
  }
  return `${score}/${maxScore}`;
}

// ============================================
// Array Utilities
// ============================================

/**
 * Fisher-Yates shuffle algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get random items from array
 */
export function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, Math.min(count, array.length));
}

// ============================================
// Question Utilities
// ============================================

/**
 * Get difficulty color
 */
export function getDifficultyColor(difficulty: DifficultyLevel): string {
  const colors: Record<DifficultyLevel, string> = {
    EASY: "#10B981",
    MEDIUM: "#F59E0B",
    HARD: "#EF4444",
  };
  return colors[difficulty];
}

/**
 * Get difficulty badge classes
 */
export function getDifficultyBadgeClass(difficulty: DifficultyLevel): string {
  const classes: Record<DifficultyLevel, string> = {
    EASY: "bg-green-100 text-green-800 border-green-300",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-300",
    HARD: "bg-red-100 text-red-800 border-red-300",
  };
  return classes[difficulty];
}

/**
 * Get Bloom's level color
 */
export function getBloomLevelColor(level: BloomLevel): string {
  const colors: Record<BloomLevel, string> = {
    REMEMBER: "#93C5FD",
    UNDERSTAND: "#60A5FA",
    APPLY: "#3B82F6",
    ANALYZE: "#2563EB",
    EVALUATE: "#1D4ED8",
    CREATE: "#1E40AF",
  };
  return colors[level];
}

/**
 * Get question type icon
 */
export function getQuestionTypeIcon(type: QuestionType): string {
  const icons: Record<QuestionType, string> = {
    MULTIPLE_CHOICE: "☑️",
    TRUE_FALSE: "✓✗",
    SHORT_ANSWER: "✍️",
    ESSAY: "📝",
    FILL_BLANK: "___",
  };
  return icons[type];
}

// ============================================
// Validation Utilities
// ============================================

/**
 * Check if answer is correct for MCQ/True-False
 */
export function checkMCQAnswer(
  userAnswer: string,
  correctAnswer: string
): boolean {
  return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
}

/**
 * Check if fill-in-blank answer is correct
 */
export function checkFillBlankAnswer(
  userAnswer: string,
  acceptedAnswers: string[],
  caseSensitive: boolean = false
): boolean {
  const answer = caseSensitive ? userAnswer.trim() : userAnswer.trim().toLowerCase();
  const accepted = caseSensitive
    ? acceptedAnswers.map((a) => a.trim())
    : acceptedAnswers.map((a) => a.trim().toLowerCase());

  return accepted.includes(answer);
}

/**
 * Calculate similarity between two strings (for short answer grading)
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

// ============================================
// Statistics Utilities
// ============================================

/**
 * Calculate accuracy rate
 */
export function calculateAccuracy(correct: number, total: number): number {
  return total > 0 ? (correct / total) * 100 : 0;
}

/**
 * Calculate average
 */
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
}

/**
 * Get grade from percentage
 */
export function getGradeFromPercentage(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 85) return "A";
  if (percentage >= 80) return "A-";
  if (percentage >= 75) return "B+";
  if (percentage >= 70) return "B";
  if (percentage >= 65) return "B-";
  if (percentage >= 60) return "C+";
  if (percentage >= 55) return "C";
  if (percentage >= 50) return "C-";
  if (percentage >= 45) return "D";
  return "F";
}

/**
 * Get performance level from percentage
 */
export function getPerformanceLevel(percentage: number): {
  level: string;
  color: string;
  message: string;
} {
  if (percentage >= 90) {
    return {
      level: "Excellent",
      color: "#10B981",
      message: "Outstanding performance!",
    };
  }
  if (percentage >= 80) {
    return {
      level: "Very Good",
      color: "#3B82F6",
      message: "Great job!",
    };
  }
  if (percentage >= 70) {
    return {
      level: "Good",
      color: "#8B5CF6",
      message: "Well done!",
    };
  }
  if (percentage >= 60) {
    return {
      level: "Satisfactory",
      color: "#F59E0B",
      message: "Keep practicing!",
    };
  }
  if (percentage >= 50) {
    return {
      level: "Fair",
      color: "#EF4444",
      message: "Room for improvement.",
    };
  }
  return {
    level: "Needs Improvement",
    color: "#DC2626",
    message: "Keep studying and try again!",
  };
}

// ============================================
// Game State Utilities
// ============================================

/**
 * Check if game is completed
 */
export function isGameCompleted(game: QuizGame): boolean {
  return game.status === "COMPLETED";
}

/**
 * Calculate remaining time
 */
export function calculateRemainingTime(
  startTime: Date,
  timeLimitMinutes: number | null
): number | null {
  if (!timeLimitMinutes) return null;

  const elapsedSeconds = getTimeDifferenceInSeconds(startTime, new Date());
  const limitSeconds = timeLimitMinutes * 60;
  const remaining = limitSeconds - elapsedSeconds;

  return Math.max(0, remaining);
}

/**
 * Check if time is up
 */
export function isTimeUp(startTime: Date, timeLimitMinutes: number | null): boolean {
  if (!timeLimitMinutes) return false;
  const remaining = calculateRemainingTime(startTime, timeLimitMinutes);
  return remaining !== null && remaining <= 0;
}

// ============================================
// Streak Utilities
// ============================================

/**
 * Calculate current streak
 */
export function calculateStreak(
  correctAnswers: boolean[]
): { current: number; max: number } {
  let current = 0;
  let max = 0;
  let temp = 0;

  for (const isCorrect of correctAnswers) {
    if (isCorrect) {
      temp++;
      max = Math.max(max, temp);
    } else {
      temp = 0;
    }
  }

  // Current streak is the last consecutive correct answers
  for (let i = correctAnswers.length - 1; i >= 0; i--) {
    if (correctAnswers[i]) {
      current++;
    } else {
      break;
    }
  }

  return { current, max };
}

// ============================================
// Display Utilities
// ============================================

/**
 * Get alphabetic numeral (A, B, C, D, etc.)
 */
export function alphabeticNumeral(index: number): string {
  return String.fromCharCode(65 + index);
}

/**
 * Get numeric badge (1, 2, 3, 4, etc.)
 */
export function numericBadge(index: number): string {
  return (index + 1).toString();
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

// ============================================
// Number Formatting
// ============================================

/**
 * Format large numbers with K, M suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

/**
 * Format ordinal numbers (1st, 2nd, 3rd, etc.)
 */
export function formatOrdinal(num: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = num % 100;
  return num + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
}

// ============================================
// Date Utilities
// ============================================

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const seconds = getTimeDifferenceInSeconds(date, now);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  return `${Math.floor(seconds / 2592000)} months ago`;
}

// ============================================
// Local Storage Utilities
// ============================================

/**
 * Save game state to local storage
 */
export function saveGameState(gameId: string, state: any): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`quiz_game_${gameId}`, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving game state:", error);
  }
}

/**
 * Load game state from local storage
 */
export function loadGameState(gameId: string): any | null {
  if (typeof window === "undefined") return null;
  try {
    const state = localStorage.getItem(`quiz_game_${gameId}`);
    return state ? JSON.parse(state) : null;
  } catch (error) {
    console.error("Error loading game state:", error);
    return null;
  }
}

/**
 * Clear game state from local storage
 */
export function clearGameState(gameId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`quiz_game_${gameId}`);
  } catch (error) {
    console.error("Error clearing game state:", error);
  }
}
