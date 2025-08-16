"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { examCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { ExamFormStepProps } from "./types";

export function InstructionsDetailsStep({ form, isView }: ExamFormStepProps) {
  return (
    <div className="space-y-6 w-full">
      {/* Instructions */}
      <FormField
        control={form.control}
        name="instructions"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea 
                placeholder="Exam instructions for students (optional)" 
                disabled={isView} 
                {...field} 
                rows={8}
                className="min-h-[200px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Additional Notes Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Additional Information</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>• Students should arrive 15 minutes before the exam starts</p>
          <p>• Bring necessary stationery and calculators if allowed</p>
          <p>• Mobile phones and electronic devices are not permitted</p>
          <p>• Read all instructions carefully before starting</p>
        </div>
      </div>
    </div>
  );
}
