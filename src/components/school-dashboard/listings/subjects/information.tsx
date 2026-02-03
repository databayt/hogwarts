"use client"

import { useEffect, useState } from "react"
import { type UseFormReturn } from "react-hook-form"
import { z } from "zod"

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

import { SubjectFormStepProps } from "./types"
import { subjectCreateSchema } from "./validation"

export function InformationStep({ form, isView }: SubjectFormStepProps) {
  const [departments, setDepartments] = useState<
    Array<{ id: string; departmentName: string }>
  >([])

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        // This would need to be implemented in a separate action
        // For now, we'll use a placeholder
        setDepartments([
          { id: "dep_001", departmentName: "Transfiguration" },
          { id: "dep_002", departmentName: "Potions" },
          { id: "dep_003", departmentName: "Creatures" },
        ])
      } catch (error) {
        console.error("Failed to load departments:", error)
      }
    }
    loadDepartments()
  }, [])

  return (
    <div className="w-full space-y-4">
      <FormField
        control={form.control}
        name="subjectName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subject Name</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter subject name"
                disabled={isView}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="departmentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Department</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isView}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.departmentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
