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
import { Textarea } from "@/components/ui/textarea"

import { ASSIGNMENT_TYPES } from "./config"
import { AssignmentFormStepProps } from "./types"
import { assignmentCreateSchema } from "./validation"

export function DetailsStep({ form, isView }: AssignmentFormStepProps) {
  return (
    <div className="w-full space-y-4">
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Assignment Type</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isView}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select assignment type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {ASSIGNMENT_TYPES.map((type) => (
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

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="totalPoints"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Points</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  disabled={isView}
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="100"
                  placeholder="0.00"
                  disabled={isView}
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="dueDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Due Date</FormLabel>
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
                      format(field.value, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) => date < new Date()}
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
        name="instructions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Instructions</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter assignment instructions..."
                className="min-h-[120px]"
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
