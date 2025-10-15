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
import { GRADE_OPTIONS } from "./config";

export function GradingStep({ form, isView, dictionary }: ResultFormStepProps) {
  const score = form.watch("score");
  const maxScore = form.watch("maxScore");

  // Auto-calculate percentage when score or maxScore changes
  useEffect(() => {
    // Percentage is calculated on-the-fly, no need to store it
  }, [score, maxScore, form]);

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="score"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{dictionary.school.grades.score}</FormLabel>
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
              <FormLabel>{dictionary.school.grades.maxScore}</FormLabel>
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

      {/* Percentage is calculated on-the-fly: {(score / maxScore) * 100}% */}

      <FormField
        control={form.control}
        name="grade"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{dictionary.school.grades.grade}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={dictionary.school.grades.selectGrade} />
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
            <FormLabel>{dictionary.school.grades.feedback}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={dictionary.school.grades.feedbackPlaceholder}
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
