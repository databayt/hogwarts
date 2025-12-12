import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { studentCreateSchema } from "./validation";

export type StudentDTO = {
  id: string;
  schoolId: string;
  givenName: string;
  middleName: string | null;
  surname: string;
  dateOfBirth: Date;
  gender: string;
  enrollmentDate: Date;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type StudentRow = {
  id: string;
  userId: string | null;
  name: string;
  className: string;
  status: string;
  createdAt: string;
  // Relationship counts
  classCount: number;
  gradeCount: number;
}

export interface StudentFormStepProps {
  form: UseFormReturn<z.infer<typeof studentCreateSchema>>;
  isView: boolean;
}

export type StepFieldKeys = keyof z.infer<typeof studentCreateSchema>;
