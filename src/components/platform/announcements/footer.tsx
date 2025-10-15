"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { announcementCreateSchema } from "./validation";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface FooterProps {
  currentStep: number;
  isView: boolean;
  currentId?: string;
  onBack: () => void;
  onNext: () => void;
  onSaveCurrentStep: () => void;
  form: UseFormReturn<z.infer<typeof announcementCreateSchema>>;
  dictionary: Dictionary['school']['announcements'];
}

import { STEP_FIELDS, TOTAL_FIELDS } from "./config";

export function AnnouncementFormFooter({ currentStep, isView, currentId, onBack, onNext, onSaveCurrentStep, form, dictionary }: FooterProps) {
  const t = dictionary;

  const steps = {
    1: t.basicInformation,
    2: t.scopeAndPublishing
  };
  // Calculate progress based on filled fields
  // Watch all form fields for changes
  const values = form.watch();
  
  const getFilledFieldsCount = () => {
    // Count filled fields across all steps
    const allFields = [...STEP_FIELDS[1], ...STEP_FIELDS[2]];
    const filledCount = allFields.filter(field => {
      const value = values[field as keyof typeof values];
      if (field === "classId" && values.scope !== "class") return true; // Skip if not class scope
      if (field === "role" && values.scope !== "role") return true; // Skip if not role scope
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
          {steps[currentStep as keyof typeof steps]}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onBack}
          >
            {currentStep === 1 ? t.cancel : t.back}
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
                  {t.save}
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={onNext}
              >
                {currentStep === 1 ? t.next : currentId ? t.save : t.create}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
