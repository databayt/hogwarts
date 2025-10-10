"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { teacherCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { TeacherFormStepProps } from "./types";
import { GENDER_OPTIONS } from "./config";

export function InformationStep({ form, isView }: TeacherFormStepProps) {
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

      {/* Right Column - Gender */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GENDER_OPTIONS.map((gender) => (
                    <SelectItem key={gender.value} value={gender.value}>
                      {gender.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
