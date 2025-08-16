import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { subjectCreateSchema } from "./validation";

export type SubjectDTO = {
  id: string;
  schoolId: string;
  departmentId: string;
  subjectName: string;
  department?: { id: string; departmentName: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SubjectRow = {
  id: string;
  subjectName: string;
  departmentName: string;
  createdAt: string;
}

export interface SubjectFormStepProps {
  form: UseFormReturn<z.infer<typeof subjectCreateSchema>>;
  isView: boolean;
}

export type StepFieldKeys = keyof z.infer<typeof subjectCreateSchema>;
