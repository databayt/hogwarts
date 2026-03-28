"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { CircleAlert } from "lucide-react"
import { UseFormReturn } from "react-hook-form"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface EmergencyContactStepProps {
  form: UseFormReturn<any>
  dictionary?: any
}

export function EmergencyContactStep({
  form,
  dictionary,
}: EmergencyContactStepProps) {
  const reg = dictionary?.school?.students?.registration?.emergency

  const relationshipOptions = [
    { value: "Father", label: reg?.father || "Father" },
    { value: "Mother", label: reg?.mother || "Mother" },
    { value: "Guardian", label: reg?.guardian || "Guardian" },
    { value: "Uncle", label: reg?.uncle || "Uncle" },
    { value: "Aunt", label: reg?.aunt || "Aunt" },
    { value: "Grandfather", label: reg?.grandfather || "Grandfather" },
    { value: "Grandmother", label: reg?.grandmother || "Grandmother" },
    { value: "Brother", label: reg?.brother || "Brother" },
    { value: "Sister", label: reg?.sister || "Sister" },
    { value: "Other", label: reg?.other || "Other" },
  ]

  return (
    <div className="grid gap-6">
      <Alert>
        <CircleAlert className="h-4 w-4" />
        <AlertTitle>{reg?.important || "Important"}</AlertTitle>
        <AlertDescription>
          {reg?.importantDescription ||
            "Emergency contact information will be used only in case of emergencies. Please provide accurate and up-to-date contact details."}
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="emergencyContactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {reg?.contactName || "Emergency Contact Name *"}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={reg?.enterFullName || "Enter full name"}
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
            name="emergencyContactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {reg?.contactPhone || "Emergency Contact Phone *"}
                </FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+966 XX XXX XXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergencyContactRelation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{reg?.relationship || "Relationship *"}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          reg?.selectRelationship || "Select relationship"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {relationshipOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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

      <div className="bg-muted rounded-lg p-4">
        <h5 className="mb-2">{reg?.tips || "Tips for Emergency Contacts"}</h5>
        <ul className="text-muted-foreground space-y-1 text-sm">
          <li>
            {reg?.tip1 ||
              "Provide at least one local contact who can be reached quickly"}
          </li>
          <li>
            {reg?.tip2 ||
              "Include both mobile and landline numbers if available"}
          </li>
          <li>
            {reg?.tip3 ||
              "Update emergency contacts whenever there are changes"}
          </li>
          <li>
            {reg?.tip4 ||
              "Ensure the emergency contact is aware they are listed"}
          </li>
        </ul>
      </div>
    </div>
  )
}
