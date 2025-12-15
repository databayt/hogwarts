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

import { GENDER_OPTIONS } from "./config"
import { StudentFormStepProps } from "./types"
import { studentCreateSchema } from "./validation"

export function InformationStep({ form, isView }: StudentFormStepProps) {
  return (
    <div className="grid w-full grid-cols-3 gap-8">
      {/* Left Column - Names (2/3 width) */}
      <div className="col-span-2 space-y-4">
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
          name="middleName"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Middle name" disabled={isView} {...field} />
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

      {/* Right Column - Date and Gender */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="dateOfBirth"
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
                        <span>Date of birth</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                  sideOffset={4}
                >
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
          name="gender"
          render={({ field }) => (
            <FormItem>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isView}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
