"use client";

import { FormControl, FormField, FormItem, FormMessage, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EvaluationTypeSelector } from "./evaluation-type-selector";
import { PrerequisiteSelector } from "./prerequisite-selector";
import { ClassFormStepProps } from "./types";

export function CourseManagementStep({ form, isView }: ClassFormStepProps) {
  // Note: 'id' field only exists in update schema, not in create schema
  // PrerequisiteSelector handles undefined currentClassId gracefully
  const currentClassId = undefined;

  return (
    <div className="space-y-6 w-full">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="courseCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., CS101, MATH201"
                  disabled={isView}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Unique identifier for this course
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="credits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Credit Hours</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="999.99"
                  placeholder="e.g., 3.0"
                  disabled={isView}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Academic credits for this course
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <EvaluationTypeSelector form={form} disabled={isView} />

      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="minCapacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min Students</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g., 10"
                  disabled={isView}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Minimum enrollment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxCapacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Students</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g., 50"
                  disabled={isView}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Maximum enrollment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (weeks)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g., 16"
                  disabled={isView}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Course length
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <PrerequisiteSelector form={form} disabled={isView} currentClassId={currentClassId} />
    </div>
  );
}
