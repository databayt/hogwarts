// About School step types

export interface AboutSchoolData {
  viewed: boolean;
  viewedAt?: Date;
}

export interface WelcomeData {
  totalSteps: number;
  estimatedTime: string;
  completionRate: number;
}

export interface OnboardingStats {
  averageCompletionTime: number;
  mostCommonSchoolTypes: string[];
  successfulCompletions: number;
}

export interface AboutSchoolProps {
  schoolId?: string;
  onContinue?: () => void;
  showProgress?: boolean;
}