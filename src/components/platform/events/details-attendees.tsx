"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { eventCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { EventFormStepProps } from "./types";
import { TARGET_AUDIENCES } from "./constants";

export function DetailsAttendeesStep({ form, isView }: EventFormStepProps) {
  return (
    <div className="space-y-6 w-full">
      {/* Organizer */}
      <FormField
        control={form.control}
        name="organizer"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input 
                placeholder="Event organizer (e.g., Teacher Name, Department)" 
                disabled={isView} 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Target Audience */}
      <FormField
        control={form.control}
        name="targetAudience"
        render={({ field }) => (
          <FormItem>
            <Select onValueChange={field.onChange} value={field.value || ""} disabled={isView}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {TARGET_AUDIENCES.map((audience) => (
                  <SelectItem key={audience} value={audience}>
                    {audience}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Max Attendees */}
      <FormField
        control={form.control}
        name="maxAttendees"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input 
                type="number" 
                placeholder="Maximum number of attendees (optional)" 
                disabled={isView} 
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Public Event and Registration */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isView}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Public Event
                </label>
                <p className="text-sm text-muted-foreground">
                  This event is open to the public
                </p>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="registrationRequired"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isView}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Registration Required
                </label>
                <p className="text-sm text-muted-foreground">
                  Attendees must register to attend this event
                </p>
              </div>
            </FormItem>
          )}
        />
      </div>

      {/* Notes */}
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea 
                placeholder="Additional notes or special instructions (optional)" 
                disabled={isView} 
                {...field} 
                rows={4}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
