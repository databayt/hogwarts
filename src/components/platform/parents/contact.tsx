"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { parentCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { ParentFormStepProps } from "./types";

export function ContactStep({ form, isView }: ParentFormStepProps) {
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
                placeholder="Email address (optional)" 
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
        name="userId"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input 
                placeholder="User ID (optional)" 
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
