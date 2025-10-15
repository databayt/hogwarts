"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { resultCreateSchema } from "./validation";
import { type Dictionary } from "@/components/internationalization/dictionaries";

interface FooterProps {
  currentStep: number;
  isView: boolean;
  currentId?: string;
  onBack: () => void;
  onNext: () => void;
  onSaveCurrentStep: () => void;
  form: UseFormReturn<z.infer<typeof resultCreateSchema>>;
  dictionary: Dictionary;
}

import { STEP_FIELDS, TOTAL_FIELDS } from "./config";

export function ResultFormFooter({ currentStep, isView, currentId, onBack, onNext, onSaveCurrentStep, form, dictionary }: FooterProps) {
  // Calculate progress based on filled fields
  // Watch all form fields for changes
  const values = form.watch();
  
  const getFilledFieldsCount = () => {
    // Count filled fields across all steps
    const allFields = [...STEP_FIELDS[1], ...STEP_FIELDS[2]];
    const filledCount = allFields.filter(field => {
      const value = values[field as keyof typeof values];
      return value !== undefined && value !== "" && value !== null;
    }).length;
    
    return filledCount;
  };

  const filledFields = getFilledFieldsCount();
  const progressPercentage = (filledFields / TOTAL_FIELDS) * 100;

  return (
    <div className="">
      <div className="py-3">
        <Progress value={progressPercentage} className="h-1" />
      </div>
      
      <div className="flex items-center justify-between ">
        <div className="text-sm font-medium text-muted-foreground">
          {currentStep === 1 ? dictionary.school.grades.studentAssignmentInfo : dictionary.school.grades.gradingInfo}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onBack}
          >
            {currentStep === 1 ? dictionary.school.common.actions.cancel : dictionary.school.grades.back}
          </Button>
          {!isView && (
            <>
              {currentId && currentStep === 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onSaveCurrentStep}
                  disabled={!form.formState.isDirty}
                >
                  {dictionary.school.common.actions.save}
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={onNext}
              >
                {currentStep === 1 ? dictionary.school.grades.next : currentId ? dictionary.school.common.actions.save : dictionary.school.grades.createResult}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
