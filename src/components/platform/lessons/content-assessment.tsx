"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { lessonCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

import { LessonFormStepProps } from "./types";

export function ContentAssessmentStep({ form, isView }: LessonFormStepProps) {
  return (
    <div className="space-y-4 w-full">
      <FormField
        control={form.control}
        name="objectives"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Learning Objectives</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="What will students learn in this lesson?" 
                className="min-h-[100px]"
                disabled={isView} 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="materials"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Required Materials</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="What materials, books, or resources are needed?" 
                className="min-h-[100px]"
                disabled={isView} 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="activities"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lesson Activities</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Describe the main activities and structure of the lesson" 
                className="min-h-[120px]"
                disabled={isView} 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="assessment"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Assessment & Evaluation</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="How will you assess student understanding and progress?" 
                className="min-h-[100px]"
                disabled={isView} 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Additional Notes</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Any additional notes, reminders, or special instructions" 
                className="min-h-[100px]"
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
