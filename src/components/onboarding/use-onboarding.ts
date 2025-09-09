"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { 
  OnboardingSchoolData, 
  OnboardingStep, 
  OnboardingProgress,
  OnboardingFormState,
  SchoolWithStatus
} from './type';
import { 
  getListing, 
  updateListing, 
  getSchoolSetupStatus, 
  proceedToTitle,
  getUserSchools 
} from './actions';
import { validateStep } from './validation';
import { ONBOARDING_STEPS, STEP_ORDER } from './constant';

// Main onboarding hook
export function useOnboarding(schoolId?: string) {
  const router = useRouter();
  const params = useParams();
  
  const [school, setSchool] = useState<OnboardingSchoolData | null>(null);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentSchoolId = schoolId || (params?.id as string);
  const currentStep = params?.step as OnboardingStep || 'about-school';

  // Load school data and progress
  const loadSchoolData = useCallback(async () => {
    if (!currentSchoolId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [schoolResponse, statusResponse] = await Promise.all([
        getListing(currentSchoolId),
        getSchoolSetupStatus(currentSchoolId)
      ]);

      if (schoolResponse.success && schoolResponse.data) {
        setSchool(schoolResponse.data);
      } else {
        setError(typeof schoolResponse.error === 'string' ? schoolResponse.error : 'Failed to load school');
      }

      if (statusResponse.success && statusResponse.data) {
        const statusData = statusResponse.data as SchoolWithStatus;
        setProgress({
          schoolId: currentSchoolId,
          currentStep,
          completedSteps: getCompletedSteps(statusData),
          completionPercentage: statusData.completionPercentage,
          nextStep: statusData.nextStep,
          canProceed: statusData.completionPercentage >= 80, // Can proceed if 80% complete
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error loading school data:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentSchoolId, currentStep]);

  // Update school data
  const updateSchoolData = useCallback(async (data: Partial<OnboardingSchoolData>) => {
    if (!currentSchoolId) return;

    try {
      setIsSaving(true);
      const response = await updateListing(currentSchoolId, data);

      if (response.success && response.data) {
        setSchool(prev => ({ ...prev, ...response.data }));
        console.log('Changes saved successfully');
        
        // Refresh progress after update
        await loadSchoolData();
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : 'Failed to update school');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save changes';
      console.error('Error updating school:', errorMessage);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [currentSchoolId, loadSchoolData]);

  // Navigate to next step
  const goToNextStep = useCallback(async () => {
    if (!currentSchoolId || !progress?.nextStep) return;

    try {
      await proceedToTitle(currentSchoolId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to proceed to next step';
      console.error('Error proceeding to next step:', errorMessage);
    }
  }, [currentSchoolId, progress?.nextStep]);

  // Navigate to specific step
  const goToStep = useCallback((step: OnboardingStep) => {
    if (!currentSchoolId) return;
    router.push(`/onboarding/${currentSchoolId}/${step}`);
  }, [currentSchoolId, router]);

  // Validate current step
  const validateCurrentStep = useCallback(() => {
    if (!school) return { isValid: false, errors: {} };
    return validateStep(currentStep, school);
  }, [school, currentStep]);

  // Check if step is accessible
  const isStepAccessible = useCallback((step: OnboardingStep) => {
    const stepConfig = ONBOARDING_STEPS[step];
    if (!stepConfig.dependencies || stepConfig.dependencies.length === 0) {
      return true;
    }

    return stepConfig.dependencies.every(dep => 
      progress?.completedSteps.includes(dep)
    );
  }, [progress?.completedSteps]);

  // Load data on mount or when schoolId changes
  useEffect(() => {
    loadSchoolData();
  }, [loadSchoolData]);

  return {
    // Data
    school,
    progress,
    currentStep,
    
    // State
    isLoading,
    isSaving,
    error,
    
    // Actions
    updateSchool: updateSchoolData,
    goToNextStep,
    goToStep,
    refreshData: loadSchoolData,
    
    // Validation
    validateCurrentStep,
    isStepAccessible,
  };
}

// Hook for managing form state
export function useOnboardingForm(initialData?: Partial<OnboardingSchoolData>) {
  const [formState, setFormState] = useState<OnboardingFormState>({
    isLoading: false,
    isSubmitting: false,
    errors: {},
    touched: {},
    isDirty: false,
  });
  
  const [data, setData] = useState<Partial<OnboardingSchoolData>>(initialData || {});

  const updateField = useCallback((field: keyof OnboardingSchoolData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    setFormState(prev => ({
      ...prev,
      touched: { ...prev.touched, [field]: true },
      isDirty: true,
      errors: { ...prev.errors, [field]: undefined }, // Clear field error on change
    }));
  }, []);

  const updateFields = useCallback((fields: Partial<OnboardingSchoolData>) => {
    setData(prev => ({ ...prev, ...fields }));
    setFormState(prev => ({
      ...prev,
      isDirty: true,
      touched: Object.keys(fields).reduce((acc, key) => ({ ...acc, [key]: true }), prev.touched),
    }));
  }, []);

  const setFieldError = useCallback((field: string, error: string) => {
    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
    }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: undefined },
    }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setFormState(prev => ({ ...prev, isLoading }));
  }, []);

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setFormState(prev => ({ ...prev, isSubmitting }));
  }, []);

  const resetForm = useCallback((newData?: Partial<OnboardingSchoolData>) => {
    setData(newData || {});
    setFormState({
      isLoading: false,
      isSubmitting: false,
      errors: {},
      touched: {},
      isDirty: false,
    });
  }, []);

  return {
    data,
    formState,
    updateField,
    updateFields,
    setFieldError,
    clearFieldError,
    setLoading,
    setSubmitting,
    resetForm,
  };
}

// Hook for managing multiple schools
export function useUserSchools() {
  const [schools, setSchools] = useState<OnboardingSchoolData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchools = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getUserSchools();
      
      if (response.success && response.data) {
        setSchools(response.data);
      } else {
        setError(typeof response.error === 'string' ? response.error : 'Failed to load schools');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load schools';
      setError(errorMessage);
      console.error('Error loading schools:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

  return {
    schools,
    isLoading,
    error,
    refreshSchools: loadSchools,
  };
}

// Helper function to determine completed steps
function getCompletedSteps(statusData: SchoolWithStatus): OnboardingStep[] {
  const completedSteps: OnboardingStep[] = [];
  
  // Check each step's completion based on data
  if (statusData.name && statusData.name !== 'New School') {
    completedSteps.push('title');
  }
  
  if (statusData.description) {
    completedSteps.push('description');
  }
  
  if (statusData.address) {
    completedSteps.push('location');
  }
  
  if (statusData.maxStudents && statusData.maxTeachers) {
    completedSteps.push('capacity');
  }
  
  if (statusData.logo || statusData.primaryColor) {
    completedSteps.push('branding');
  }
  
  if (statusData.tuitionFee && statusData.currency) {
    completedSteps.push('price');
  }
  
  return completedSteps;
}