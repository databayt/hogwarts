import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { teacherCreateSchema } from "./validation";

export type TeacherDTO = {
  id: string;
  schoolId: string;
  givenName: string;
  surname: string;
  gender: string | null;
  emailAddress: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TeacherRow = {
  id: string;
  name: string;
  emailAddress: string;
  status: string;
  createdAt: string;
}

export interface TeacherFormStepProps {
  form: UseFormReturn<z.infer<typeof teacherCreateSchema>>;
  isView: boolean;
}

export type StepFieldKeys = keyof z.infer<typeof teacherCreateSchema>;
