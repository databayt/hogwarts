import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { examCreateSchema } from "./validation";

// Explicit type for exam form data to avoid Zod inference issues
export type ExamFormData = {
  title: string;
  description?: string;
  classId: string;
  subjectId: string;
  examDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  examType: "MIDTERM" | "FINAL" | "QUIZ" | "TEST" | "PRACTICAL";
  instructions?: string;
  forceCreate: boolean;
};

export type ExamDTO = {
  id: string;
  schoolId: string;
  title: string;
  description: string | null;
  classId: string;
  subjectId: string;
  examDate: Date;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  examType: "MIDTERM" | "FINAL" | "QUIZ" | "ASSIGNMENT" | "PROJECT";
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  instructions: string | null;
  class?: { id: string; name: string } | null;
  subject?: { id: string; subjectName: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ExamRow = {
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

export interface ExamFormStepProps {
  form: any; // Simplified to avoid complex react-hook-form generic type issues
  isView: boolean;
}

export type StepFieldKeys = keyof ExamFormData;
