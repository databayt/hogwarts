import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { classCreateSchema } from "./validation";

export type ClassDTO = {
  id: string;
  schoolId: string;
  subjectId: string;
  teacherId: string;
  termId: string;
  startPeriodId: string;
  endPeriodId: string;
  classroomId: string;
  name: string;
  subject?: { id: string; subjectName: string } | null;
  teacher?: { id: string; givenName: string; surname: string } | null;
  term?: { id: string; termName: string } | null;
  startPeriod?: { id: string; periodName: string } | null;
  endPeriod?: { id: string; periodName: string } | null;
  classroom?: { id: string; roomName: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ClassRow = {
  id: string;
  name: string;
  subjectName: string;
  teacherName: string;
  termName: string;
  createdAt: string;
}

export interface ClassFormStepProps {
  form: UseFormReturn<z.infer<typeof classCreateSchema>>;
  isView: boolean;
}

export type StepFieldKeys = keyof z.infer<typeof classCreateSchema>;
