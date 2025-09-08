import type { OnboardingStep, OnboardingSchoolData, OnboardingProgress } from './type';
import { ONBOARDING_STEPS, STEP_ORDER, REQUIRED_STEPS } from './constant';

/**
 * Utility functions for onboarding flow management
 */

// Step navigation utilities
export function getStepIndex(step: OnboardingStep): number {
  return STEP_ORDER.indexOf(step);
}

export function getNextStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex === -1 || currentIndex >= STEP_ORDER.length - 1) {
    return null;
  }
  return STEP_ORDER[currentIndex + 1];
}

export function getPreviousStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex <= 0) {
    return null;
  }
  return STEP_ORDER[currentIndex - 1];
}

export function isFirstStep(step: OnboardingStep): boolean {
  return getStepIndex(step) === 0;
}

export function isLastStep(step: OnboardingStep): boolean {
  return getStepIndex(step) === STEP_ORDER.length - 1;
}

// Progress calculation utilities
export function calculateProgress(data: OnboardingSchoolData): number {
  const checks = [
    // Basic information
    !!(data.name && data.name !== 'New School'),
    !!data.description,
    !!data.address,
    !!data.city,
    !!data.state,
    
    // Capacity
    !!(data.maxStudents && data.maxStudents > 0),
    !!(data.maxTeachers && data.maxTeachers > 0),
    
    // Branding (optional but adds to completion)
    !!data.logo,
    !!data.primaryColor,
    
    // Pricing
    !!(data.tuitionFee && data.tuitionFee > 0),
    !!data.currency,
    !!data.paymentSchedule,
    
    // School details
    !!data.schoolLevel,
    !!data.schoolType,
  ];
  
  const completedChecks = checks.filter(Boolean).length;
  return Math.round((completedChecks / checks.length) * 100);
}

export function getCompletedSteps(data: OnboardingSchoolData): OnboardingStep[] {
  const completed: OnboardingStep[] = [];
  
  // Check title step
  if (data.name && data.name !== 'New School') {
    completed.push('title');
  }
  
  // Check description step
  if (data.description && data.schoolLevel && data.schoolType) {
    completed.push('description');
  }
  
  // Check location step
  if (data.address && data.city && data.state) {
    completed.push('location');
  }
  
  // Check capacity step
  if (data.maxStudents && data.maxTeachers) {
    completed.push('capacity');
  }
  
  // Check branding step (optional)
  if (data.logo || data.primaryColor) {
    completed.push('branding');
  }
  
  // Check pricing step
  if (data.tuitionFee && data.currency && data.paymentSchedule) {
    completed.push('price');
  }
  
  return completed;
}

export function getMissingRequiredSteps(data: OnboardingSchoolData): OnboardingStep[] {
  const completedSteps = getCompletedSteps(data);
  return REQUIRED_STEPS.filter(step => !completedSteps.includes(step));
}

export function canProceedToStep(
  targetStep: OnboardingStep, 
  data: OnboardingSchoolData
): boolean {
  const stepConfig = ONBOARDING_STEPS[targetStep];
  if (!stepConfig.dependencies) {
    return true;
  }
  
  const completedSteps = getCompletedSteps(data);
  return stepConfig.dependencies.every(dep => completedSteps.includes(dep));
}

// Data validation utilities
export function validateRequiredFields(data: OnboardingSchoolData): string[] {
  const errors: string[] = [];
  
  if (!data.name || data.name === 'New School') {
    errors.push('School name is required');
  }
  
  if (!data.description) {
    errors.push('School description is required');
  }
  
  if (!data.address) {
    errors.push('School address is required');
  }
  
  if (!data.city) {
    errors.push('City is required');
  }
  
  if (!data.state) {
    errors.push('State/Province is required');
  }
  
  if (!data.maxStudents || data.maxStudents <= 0) {
    errors.push('Maximum students must be greater than 0');
  }
  
  if (!data.maxTeachers || data.maxTeachers <= 0) {
    errors.push('Maximum teachers must be greater than 0');
  }
  
  return errors;
}

// Formatting utilities
export function formatCurrency(amount: number, currency: string): string {
  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
  };
  
  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toLocaleString()}`;
}

export function formatCapacity(students: number, teachers: number): string {
  const ratio = Math.round(students / teachers);
  return `${students} students, ${teachers} teachers (${ratio}:1 ratio)`;
}

export function formatSchoolType(level: string, type: string): string {
  const levelMap: Record<string, string> = {
    primary: 'Primary',
    secondary: 'Secondary',
    both: 'Primary & Secondary',
  };
  
  const typeMap: Record<string, string> = {
    private: 'Private',
    public: 'Public',
    international: 'International',
    technical: 'Technical',
    special: 'Special Needs',
  };
  
  const formattedLevel = levelMap[level] || level;
  const formattedType = typeMap[type] || type;
  
  return `${formattedType} ${formattedLevel} School`;
}

// URL and routing utilities
export function generateSchoolSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
  return domainRegex.test(domain);
}

// Step metadata utilities
export function getStepTitle(step: OnboardingStep): string {
  return ONBOARDING_STEPS[step]?.title || step;
}

export function getStepDescription(step: OnboardingStep): string {
  return ONBOARDING_STEPS[step]?.description || '';
}

export function getStepGroup(step: OnboardingStep): string {
  return ONBOARDING_STEPS[step]?.group || 'basic';
}

export function isStepRequired(step: OnboardingStep): boolean {
  return ONBOARDING_STEPS[step]?.isRequired || false;
}

// Progress tracking utilities
export function createProgressState(
  schoolId: string,
  currentStep: OnboardingStep,
  data: OnboardingSchoolData
): OnboardingProgress {
  const completedSteps = getCompletedSteps(data);
  const completionPercentage = calculateProgress(data);
  const nextStep = getNextStep(currentStep);
  
  return {
    schoolId,
    currentStep,
    completedSteps,
    completionPercentage,
    nextStep,
    canProceed: completionPercentage >= 80, // Can proceed if 80% complete
  };
}

// Error handling utilities
export function createErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error?.message) {
    return error.error.message;
  }
  
  return 'An unexpected error occurred';
}

export function isNetworkError(error: any): boolean {
  return (
    error?.name === 'NetworkError' ||
    error?.code === 'NETWORK_ERROR' ||
    error?.message?.includes('network') ||
    error?.message?.includes('fetch')
  );
}

// Local storage utilities for draft saving
export const DRAFT_STORAGE_KEY = 'onboarding_draft_';

export function saveDraftToStorage(schoolId: string, data: Partial<OnboardingSchoolData>): void {
  try {
    const key = `${DRAFT_STORAGE_KEY}${schoolId}`;
    localStorage.setItem(key, JSON.stringify({
      ...data,
      lastSaved: new Date().toISOString(),
    }));
  } catch (error) {
    console.warn('Failed to save draft to localStorage:', error);
  }
}

export function loadDraftFromStorage(schoolId: string): Partial<OnboardingSchoolData> | null {
  try {
    const key = `${DRAFT_STORAGE_KEY}${schoolId}`;
    const draft = localStorage.getItem(key);
    if (draft) {
      const data = JSON.parse(draft);
      // Remove lastSaved from the actual data
      const { lastSaved, ...draftData } = data;
      return draftData;
    }
  } catch (error) {
    console.warn('Failed to load draft from localStorage:', error);
  }
  return null;
}

export function clearDraftFromStorage(schoolId: string): void {
  try {
    const key = `${DRAFT_STORAGE_KEY}${schoolId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear draft from localStorage:', error);
  }
}

// Performance monitoring utilities
export function measureStepTime(step: OnboardingStep, startTime: number): void {
  const duration = Date.now() - startTime;
  
  // Log performance metrics for optimization
  console.log(`Step ${step} completed in ${duration}ms`);
  
  // You can extend this to send metrics to your analytics service
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(`onboarding-${step}-complete`);
  }
}

export function trackStepEntry(step: OnboardingStep): number {
  const timestamp = Date.now();
  
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(`onboarding-${step}-start`);
  }
  
  return timestamp;
}