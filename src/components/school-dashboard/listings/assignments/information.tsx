"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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
import { Textarea } from "@/components/ui/textarea"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { AssignmentFormStepProps } from "./types"
import { assignmentCreateSchema } from "./validation"

export function InformationStep({ form, isView }: AssignmentFormStepProps) {
  const { dictionary } = useDictionary()
  const d = (dictionary?.school as Record<string, any>)?.assignments?.form as
    | Record<string, any>
    | undefined
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>(
    []
  )

  useEffect(() => {
    const loadClasses = async () => {
      try {
        // This would need to be implemented in separate actions
        // For now, we'll use placeholders
        setClasses([
          { id: "cls_001", name: "Transfiguration 101" },
          { id: "cls_002", name: "Potions 101" },
          { id: "cls_003", name: "Creatures 101" },
        ])
      } catch (error) {
        console.error("Failed to load classes:", error)
      }
    }
    loadClasses()
  }, [])

  return (
    <div className="w-full space-y-4">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{d?.assignmentTitle || "Assignment Title"}</FormLabel>
            <FormControl>
              <Input
                placeholder={d?.enterTitle || "Enter assignment title"}
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
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{d?.description || "Description"}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={
                  d?.enterDescription || "Enter assignment description..."
                }
                className="min-h-[100px]"
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
        name="classId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{d?.class || "Class"}</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isView}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={d?.selectClass || "Select class"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
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
