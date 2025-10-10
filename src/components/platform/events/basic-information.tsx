"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { eventCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EventFormStepProps } from "./types";
import { EVENT_TYPES } from "./config";

export function BasicInformationStep({ form, isView }: EventFormStepProps) {
  return (
    <div className="space-y-6 w-full">
      {/* Title */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input placeholder="Event title" disabled={isView} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Description */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea 
                placeholder="Event description (optional)" 
                disabled={isView} 
                {...field} 
                rows={4}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Event Type */}
      <FormField
        control={form.control}
        name="eventType"
        render={({ field }) => (
          <FormItem>
            <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
