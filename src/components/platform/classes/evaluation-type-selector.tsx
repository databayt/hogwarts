"use client";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EVALUATION_TYPES } from "@/lib/evaluation-types";
import { type UseFormReturn } from "react-hook-form";

interface EvaluationTypeSelectorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  disabled?: boolean;
}

export function EvaluationTypeSelector({ form, disabled = false }: EvaluationTypeSelectorProps) {
  return (
    <FormField
      control={form.control}
      name="evaluationType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Evaluation Type</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value || "NORMAL"}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select evaluation type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {Object.values(EVALUATION_TYPES).map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{type.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {type.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            Choose how student performance will be evaluated in this course
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
