"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { StudentFormStepProps } from "./types"

type AcademicGradeOption = {
  id: string
  name: string
  gradeNumber: number
  level: { id: string; name: string; level: string } | null
}

export function EnrollmentStep({
  form,
  isView,
  academicGrades,
}: StudentFormStepProps & { academicGrades?: AcademicGradeOption[] }) {
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
                      "w-full ps-3 text-start font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                    disabled={isView}
                  >
                    {field.value ? (
                      format(new Date(field.value), "PPP")
                    ) : (
                      <span>Enrollment date</span>
                    )}
                    <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
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

      {academicGrades && academicGrades.length > 0 && (
        <FormField
          control={form.control}
          name="academicGradeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Academic Grade</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
                disabled={isView}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {academicGrades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                      {grade.level ? ` (${grade.level.name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

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
