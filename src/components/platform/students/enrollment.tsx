"use client"

import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { StudentFormStepProps } from "./types"
import { studentCreateSchema } from "./validation"

export function EnrollmentStep({ form, isView }: StudentFormStepProps) {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <FormField
        control={form.control}
        name="enrollmentDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                    disabled={isView}
                  >
                    {field.value ? (
                      format(new Date(field.value), "PPP")
                    ) : (
                      <span>Enrollment date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) =>
                    field.onChange(date?.toISOString().split("T")[0])
                  }
                  disabled={isView}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
  )
}
