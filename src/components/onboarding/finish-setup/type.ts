// Finish Setup step types

export interface FinishSetupData {
  isComplete: boolean;
  completionPercentage: number;
  completedAt?: Date;
}

export interface SetupSummary {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  maxStudents?: number;
  maxTeachers?: number;
  tuitionFee?: number;
  currency?: string;
  domain?: string;
  logo?: string;
  isPublished: boolean;
  completionPercentage: number;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinishSetupProps {
  schoolId: string;
  summary?: SetupSummary;
  onComplete?: () => void;
  onEdit?: (step: string) => void;
  isCompleting?: boolean;
}

export interface SetupStepStatus {
  step: string;
  title: string;
  completed: boolean;
  required: boolean;
}