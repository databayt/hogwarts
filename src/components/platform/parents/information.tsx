"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { parentCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { ParentFormStepProps } from "./types";

export function InformationStep({ form, isView }: ParentFormStepProps) {
  return (
    <div className="grid grid-cols-2 gap-8 w-full">
      {/* Left Column - Names */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="givenName"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Given name" disabled={isView} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="surname"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Surname" disabled={isView} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Right Column - Empty for now, could add more fields later */}
      <div className="space-y-4">
        {/* Future fields could go here */}
      </div>
    </div>
  );
}
