// Guardian Step Types

export interface GuardianFormData {
  fatherName: string;
  fatherOccupation?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  motherName: string;
  motherOccupation?: string;
  motherPhone?: string;
  motherEmail?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;
  guardianEmail?: string;
}

export interface GuardianFormRef {
  saveAndNext: () => Promise<void>;
}

export interface GuardianFormProps {
  sessionToken?: string;
  initialData?: Partial<GuardianFormData>;
  onSuccess?: () => void;
  dictionary?: Record<string, unknown>;
}
