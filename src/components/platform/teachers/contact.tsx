"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { teacherCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { TeacherFormStepProps } from "./types";

export function ContactStep({ form, isView }: TeacherFormStepProps) {
  return (
    <div className="space-y-4 max-w-md mx-auto">
      <FormField
        control={form.control}
        name="emailAddress"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input 
                type="email" 
                placeholder="Email address" 
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
