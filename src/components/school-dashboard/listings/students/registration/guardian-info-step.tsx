"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Plus, Trash2, User } from "lucide-react"
import { useFieldArray, UseFormReturn } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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

interface GuardianInfoStepProps {
  form: UseFormReturn<any>
  dictionary?: any
}

export function GuardianInfoStep({ form, dictionary }: GuardianInfoStepProps) {
  const reg = dictionary?.school?.students?.registration?.guardian

  const relationOptions = [
    { value: "Father", label: reg?.father || "Father" },
    { value: "Mother", label: reg?.mother || "Mother" },
    { value: "Legal Guardian", label: reg?.legalGuardian || "Legal Guardian" },
    { value: "Uncle", label: reg?.uncle || "Uncle" },
    { value: "Aunt", label: reg?.aunt || "Aunt" },
    { value: "Grandfather", label: reg?.grandfather || "Grandfather" },
    { value: "Grandmother", label: reg?.grandmother || "Grandmother" },
    { value: "Other", label: reg?.other || "Other" },
  ]

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "guardians",
  })

  const addGuardian = () => {
    append({
      firstName: "",
      lastName: "",
      relation: "",
      email: "",
      mobileNumber: "",
      occupation: "",
      isPrimary: fields.length === 0,
    })
  }

  // Ensure at least one guardian
  if (fields.length === 0) {
    addGuardian()
  }

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <Card key={field.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {reg?.title || "Guardian"} {index + 1}
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name={`guardians.${index}.firstName`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{reg?.firstName || "First Name *"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={reg?.enterFirstName || "Enter first name"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`guardians.${index}.lastName`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{reg?.lastName || "Last Name *"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={reg?.enterLastName || "Enter last name"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`guardians.${index}.relation`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {reg?.relationship || "Relationship *"}
                    </FormLabel>
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
                        {relationOptions.map((option) => (
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

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name={`guardians.${index}.email`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{reg?.email || "Email"}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={
                          reg?.emailPlaceholder || "guardian@example.com"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`guardians.${index}.mobileNumber`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {reg?.mobileNumber || "Mobile Number *"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder={
                          reg?.mobilePlaceholder || "+966 XX XXX XXXX"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`guardians.${index}.occupation`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{reg?.occupation || "Occupation"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={reg?.enterOccupation || "Enter occupation"}
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
              name={`guardians.${index}.isPrimary`}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        // If setting as primary, unset others
                        if (checked) {
                          fields.forEach((_, i) => {
                            if (i !== index) {
                              form.setValue(`guardians.${i}.isPrimary`, false)
                            }
                          })
                        }
                        field.onChange(checked)
                      }}
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer text-sm font-normal">
                    {reg?.primaryGuardian ||
                      "Primary Guardian (will receive all school communications)"}
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addGuardian}
        className="w-full"
      >
        <Plus className="me-2 h-4 w-4" />
        {reg?.addAnother || "Add Another Guardian"}
      </Button>
    </div>
  )
}
