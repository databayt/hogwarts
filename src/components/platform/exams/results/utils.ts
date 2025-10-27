// Results Block Utilities

import type { StudentResultDTO, GradeDistribution } from "./types";
import { GRADE_COLORS, RESULT_STATUS } from "./config";

/**
 * Format result status for display
 */
export function formatResultStatus(
  marksObtained: number,
  passingMarks: number,
  isAbsent: boolean
): string {
  if (isAbsent) return "Absent";
  return marksObtained >= passingMarks ? "Pass" : "Fail";
}

/**
 * Get status variant for badge
 */
export function getStatusVariant(
  marksObtained: number,
  passingMarks: number,
  isAbsent: boolean
): "default" | "destructive" | "secondary" {
  if (isAbsent) return "secondary";
  return marksObtained >= passingMarks ? "default" : "destructive";
}

/**
 * Get grade color
 */
export function getGradeColor(grade: string): string {
  return GRADE_COLORS[grade] || "#6B7280";
}

/**
 * Format percentage for display
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(2)}%`;
}

/**
 * Format marks for display
 */
export function formatMarks(obtained: number, total: number): string {
  return `${obtained}/${total}`;
}

/**
 * Format GPA for display
 */
export function formatGPA(gpa: number | null): string {
  if (gpa === null) return "N/A";
  return gpa.toFixed(2);
}

/**
 * Get performance level based on percentage
 */
export function getPerformanceLevel(percentage: number): {
  level: string;
  color: string;
  icon: string;
} {
  if (percentage >= 90) {
    return { level: "Excellent", color: "text-green-600", icon: "TrendingUp" };
  } else if (percentage >= 80) {
    return { level: "Very Good", color: "text-blue-600", icon: "ThumbsUp" };
  } else if (percentage >= 70) {
    return { level: "Good", color: "text-cyan-600", icon: "CheckCircle" };
  } else if (percentage >= 60) {
    return { level: "Satisfactory", color: "text-yellow-600", icon: "Minus" };
  } else if (percentage >= 50) {
    return { level: "Pass", color: "text-orange-600", icon: "AlertCircle" };
  } else {
    return { level: "Needs Improvement", color: "text-red-600", icon: "XCircle" };
  }
}

/**
 * Sort results by criteria
 */
export function sortResults(
  results: StudentResultDTO[],
  sortBy: "rank" | "name" | "marks"
): StudentResultDTO[] {
  switch (sortBy) {
    case "rank":
      return [...results].sort((a, b) => a.rank - b.rank);
    case "name":
      return [...results].sort((a, b) =>
        a.studentName.localeCompare(b.studentName)
      );
    case "marks":
      return [...results].sort((a, b) => b.marksObtained - a.marksObtained);
    default:
      return results;
  }
}

/**
 * Filter results by status
 */
export function filterResultsByStatus(
  results: StudentResultDTO[],
  status: "pass" | "fail" | "absent" | "all",
  passingMarks: number
): StudentResultDTO[] {
  switch (status) {
    case "pass":
      return results.filter(
        (r) => !r.isAbsent && r.marksObtained >= passingMarks
      );
    case "fail":
      return results.filter(
        (r) => !r.isAbsent && r.marksObtained < passingMarks
      );
    case "absent":
      return results.filter((r) => r.isAbsent);
    case "all":
    default:
      return results;
  }
}

/**
 * Group results by grade
 */
export function groupResultsByGrade(
  results: StudentResultDTO[]
): Record<string, StudentResultDTO[]> {
  return results.reduce(
    (groups, result) => {
      const grade = result.grade || "N/A";
      if (!groups[grade]) {
        groups[grade] = [];
      }
      groups[grade].push(result);
      return groups;
    },
    {} as Record<string, StudentResultDTO[]>
  );
}

/**
 * Calculate statistics for a set of results
 */
export function calculateResultStats(results: StudentResultDTO[]) {
  const presentResults = results.filter((r) => !r.isAbsent);

  if (presentResults.length === 0) {
    return {
      count: 0,
      average: 0,
      highest: 0,
      lowest: 0,
      median: 0,
      stdDev: 0,
    };
  }

  const marks = presentResults.map((r) => r.marksObtained);
  const sum = marks.reduce((a, b) => a + b, 0);
  const average = sum / marks.length;

  const sortedMarks = [...marks].sort((a, b) => a - b);
  const median =
    sortedMarks.length % 2 === 0
      ? (sortedMarks[sortedMarks.length / 2 - 1] +
          sortedMarks[sortedMarks.length / 2]) /
        2
      : sortedMarks[Math.floor(sortedMarks.length / 2)];

  const squaredDiffs = marks.map((mark) => Math.pow(mark - average, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / marks.length;
  const stdDev = Math.sqrt(variance);

  return {
    count: presentResults.length,
    average: Math.round(average * 100) / 100,
    highest: Math.max(...marks),
    lowest: Math.min(...marks),
    median: Math.round(median * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
  };
}

/**
 * Get rank suffix (1st, 2nd, 3rd, 4th, etc.)
 */
export function getRankSuffix(rank: number): string {
  const lastDigit = rank % 10;
  const lastTwoDigits = rank % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${rank}th`;
  }

  switch (lastDigit) {
    case 1:
      return `${rank}st`;
    case 2:
      return `${rank}nd`;
    case 3:
      return `${rank}rd`;
    default:
      return `${rank}th`;
  }
}

/**
 * Generate result summary text
 */
export function generateResultSummary(result: StudentResultDTO, passingMarks: number): string {
  if (result.isAbsent) {
    return `${result.studentName} was absent for this examination.`;
  }

  const status = result.marksObtained >= passingMarks ? "passed" : "failed";
  const performance = getPerformanceLevel(result.percentage);

  return `${result.studentName} ${status} with ${formatPercentage(result.percentage)} (${formatMarks(result.marksObtained, result.totalMarks)}). Performance: ${performance.level}.`;
}

/**
 * Export results to CSV format
 */
export function exportToCSV(results: StudentResultDTO[]): string {
  const headers = [
    "Rank",
    "Student ID",
    "Student Name",
    "Marks Obtained",
    "Total Marks",
    "Percentage",
    "Grade",
    "GPA",
    "Status",
  ];

  const rows = results.map((r) => [
    r.rank.toString(),
    r.studentId,
    r.studentName,
    r.marksObtained.toString(),
    r.totalMarks.toString(),
    formatPercentage(r.percentage),
    r.grade || "N/A",
    formatGPA(r.gpa),
    r.isAbsent ? "Absent" : r.marksObtained >= 0 ? "Present" : "N/A",
  ]);

  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

  return csv;
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, fileName: string) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Get result color based on performance
 */
export function getResultColor(percentage: number): string {
  if (percentage >= 90) return "text-green-600";
  if (percentage >= 80) return "text-blue-600";
  if (percentage >= 70) return "text-cyan-600";
  if (percentage >= 60) return "text-yellow-600";
  if (percentage >= 50) return "text-orange-600";
  return "text-red-600";
}

/**
 * Get result background color
 */
export function getResultBgColor(percentage: number): string {
  if (percentage >= 90) return "bg-green-50";
  if (percentage >= 80) return "bg-blue-50";
  if (percentage >= 70) return "bg-cyan-50";
  if (percentage >= 60) return "bg-yellow-50";
  if (percentage >= 50) return "bg-orange-50";
  return "bg-red-50";
}

/**
 * Validate result data
 */
export function validateResult(result: StudentResultDTO): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!result.studentId) {
    errors.push("Student ID is required");
  }

  if (!result.studentName) {
    errors.push("Student name is required");
  }

  if (result.marksObtained < 0) {
    errors.push("Marks obtained cannot be negative");
  }

  if (result.marksObtained > result.totalMarks) {
    errors.push("Marks obtained cannot exceed total marks");
  }

  if (result.percentage < 0 || result.percentage > 100) {
    errors.push("Percentage must be between 0 and 100");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
