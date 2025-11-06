/**
 * Shared types and interfaces for exam management actions
 */

export type ActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; code?: string; details?: unknown };

export interface ExamStudent {
  id: string;
  studentId: string | null;
  name: string;
  marksObtained: number | null;
  isAbsent: boolean;
  resultId: string | null;
}

export interface ExamWithClass {
  id: string;
  title: string;
  totalMarks: number;
  passingMarks: number;
  className: string;
}

export interface ExamAnalytics {
  examTitle: string;
  totalMarks: number;
  passingMarks: number;
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  passedStudents: number;
  failedStudents: number;
  passPercentage: number;
  averageMarks: number;
  averagePercentage: number;
  highestMarks: number;
  lowestMarks: number;
  gradeDistribution: Record<string, number>;
}

export interface ExamResultRow {
  id: string;
  studentId: string | null;
  studentName: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string | null;
  isAbsent: boolean;
  remarks: string | null;
}

export interface ExamListRow {
  id: string;
  title: string;
  className: string;
  subjectName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalMarks: number;
  examType: string;
  status: string;
  createdAt: string;
}

export interface MarksEntry {
  studentId: string | null;
  marksObtained: number | null;
  isAbsent: boolean;
}

export interface ExamExportData {
  examId: string;
  title: string;
  description: string;
  class: string;
  subject: string;
  examDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  examType: string;
  status: string;
  resultsEntered: number;
  createdAt: string;
}