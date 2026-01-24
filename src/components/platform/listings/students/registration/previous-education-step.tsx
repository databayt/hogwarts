"use client"

import { format } from "date-fns"
import { Calendar as CalendarIcon, School } from "lucide-react"
import { UseFormReturn } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Textarea } from "@/components/ui/textarea"

interface PreviousEducationStepProps {
  form: UseFormReturn<any>
  dictionary?: any
}

export function PreviousEducationStep({
  form,
  dictionary,
}: PreviousEducationStepProps) {
  const studentType = form.watch("studentType")
  const isTransferStudent =
    studentType === "TRANSFER" || studentType === "INTERNATIONAL"

  return (
    <div className="grid gap-6">
      {isTransferStudent && (
        <Alert>
          <School className="h-4 w-4" />
          <AlertDescription>
            As a transfer student, please provide details about your previous
            education to help us place you in the appropriate grade level.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="previousSchoolName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Previous School Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter previous school name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="previousSchoolAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Previous School Address</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter complete address of previous school"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="previousGrade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Grade/Class Completed</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Grade 5, Class X" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transferCertificateNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transfer Certificate Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter TC number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="transferDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transfer Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date()}
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
            name="reasonForTransfer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Transfer</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Family relocation, Better academics"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="previousAcademicRecord"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Academic Record/Achievements</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Mention any academic achievements, awards, or notable performance in previous school"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {!isTransferStudent && (
        <div className="bg-muted rounded-lg p-4">
          <p className="text-muted-foreground text-sm">
            Previous education information is optional for regular students but
            helps us understand the student's academic background better.
          </p>
        </div>
      )}
    </div>
  )
}
