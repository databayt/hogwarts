"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { InvoiceSchemaZod } from "./validation";
import { STEPS, STEP_FIELDS, TOTAL_FIELDS } from "./config";

interface FooterProps {
  currentStep: number;
  isView: boolean;
  currentId?: string;
  onBack: () => void;
  onNext: () => void;
  onSaveCurrentStep: () => void;
  form: UseFormReturn<z.infer<typeof InvoiceSchemaZod>>;
}

export function InvoiceFormFooter({ 
  currentStep, 
  isView, 
  currentId, 
  onBack, 
  onNext, 
  onSaveCurrentStep, 
  form 
}: FooterProps) {
  // Calculate progress based on filled fields
  const values = form.watch();
  
  const getFilledFieldsCount = () => {
    // Count filled fields across all steps
    const allFields = [...STEP_FIELDS[1], ...STEP_FIELDS[2], ...STEP_FIELDS[3]];
    const filledCount = allFields.filter(field => {
      if (field === 'from' || field === 'to') {
        const address = values[field as keyof typeof values] as any;
        return address && address.name && address.email && address.address1;
      }
      if (field === 'items') {
        const items = values[field as keyof typeof values] as any[];
        return items && items.length > 0 && items.every(item => 
          item.item_name && item.quantity > 0 && item.price > 0
        );
      }
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
      
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-muted-foreground">
          {STEPS[currentStep as keyof typeof STEPS]}
        </div>
        <div className="flex gap-3">
          <Button 
            type="button" 
            size="sm"
            variant="ghost" 
            onClick={onBack}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          {!isView && (
            <>
              {currentId && currentStep < 3 && (
                <Button 
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onSaveCurrentStep}
                  disabled={!form.formState.isDirty}
                >
                  Save
                </Button>
              )}
              <Button 
                type="button"
                size="sm"
                onClick={onNext}
              >
                {currentStep === 3 ? (currentId ? 'Update' : 'Create') : 'Next'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
