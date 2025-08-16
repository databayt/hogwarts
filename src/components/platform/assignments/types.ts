import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { assignmentCreateSchema } from "./validation";

export type AssignmentDTO = {
  id: string;
  schoolId: string;
  classId: string;
  title: string;
  description: string | null;
  type: "HOMEWORK" | "QUIZ" | "TEST" | "MIDTERM" | "FINAL_EXAM" | "PROJECT" | "LAB_REPORT" | "ESSAY" | "PRESENTATION";
  status: "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "COMPLETED" | "GRADED";
  totalPoints: number;
  weight: number;
  dueDate: Date;
  publishDate: Date | null;
  instructions: string | null;
  class?: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AssignmentRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  totalPoints: number;
  dueDate: string;
  createdAt: string;
}

export interface AssignmentFormStepProps {
  form: UseFormReturn<z.infer<typeof assignmentCreateSchema>>;
  isView: boolean;
}

export type StepFieldKeys = keyof z.infer<typeof assignmentCreateSchema>;
