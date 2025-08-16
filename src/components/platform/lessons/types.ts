import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { lessonCreateSchema } from "./validation";

export type LessonDTO = {
  id: string;
  schoolId: string;
  title: string;
  description: string | null;
  classId: string;
  teacherId: string;
  subjectId: string;
  lessonDate: Date;
  startTime: string;
  endTime: string;
  objectives: string | null;
  materials: string | null;
  activities: string | null;
  assessment: string | null;
  notes: string | null;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  class?: { id: string; name: string } | null;
  teacher?: { id: string; givenName: string; surname: string } | null;
  subject?: { id: string; subjectName: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export type LessonRow = {
  id: string;
  title: string;
  className: string;
  teacherName: string;
  subjectName: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
}

export interface LessonFormStepProps {
  form: UseFormReturn<z.infer<typeof lessonCreateSchema>>;
  isView: boolean;
}

export type StepFieldKeys = keyof z.infer<typeof lessonCreateSchema>;
