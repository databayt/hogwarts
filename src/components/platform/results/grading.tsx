"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { resultCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";

import { ResultFormStepProps } from "./types";
import { GRADE_OPTIONS } from "./constants";

export function GradingStep({ form, isView }: ResultFormStepProps) {
  const score = form.watch("score");
  const maxScore = form.watch("maxScore");

  // Auto-calculate percentage when score or maxScore changes
  useEffect(() => {
    if (score !== undefined && maxScore !== undefined && maxScore > 0) {
      const percentage = (score / maxScore) * 100;
      form.setValue("percentage", percentage);
    }
  }, [score, maxScore, form]);

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="score"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Score</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  placeholder="0.00" 
                  disabled={isView} 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxScore"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Score</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  placeholder="0.00" 
                  disabled={isView} 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="percentage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Percentage</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="0.01" 
                min="0" 
                max="100" 
                placeholder="0.00%" 
                disabled={true} 
                {...field}
                value={field.value ? `${field.value.toFixed(2)}%` : "0.00%"}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="grade"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Grade</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {GRADE_OPTIONS.map((grade) => (
                  <SelectItem key={grade.value} value={grade.value}>
                    {grade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="feedback"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Feedback</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter feedback for the student..." 
                className="min-h-[120px]"
                disabled={isView} 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
