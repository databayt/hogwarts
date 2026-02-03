"use client"

import { useEffect, useState } from "react"
import { type UseFormReturn } from "react-hook-form"

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PrerequisiteSelectorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
  disabled?: boolean
  currentClassId?: string // To prevent circular dependencies
}

export function PrerequisiteSelector({
  form,
  disabled = false,
  currentClassId,
}: PrerequisiteSelectorProps) {
  const [availableClasses, setAvailableClasses] = useState<
    Array<{ id: string; name: string; subjectName: string }>
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoading(true)
        // TODO: Implement getAvailablePrerequisites server action
        // For now, using placeholder data
        setAvailableClasses([
          {
            id: "pre_001",
            name: "Introduction to Mathematics",
            subjectName: "Mathematics",
          },
          {
            id: "pre_002",
            name: "Basic Programming",
            subjectName: "Computer Science",
          },
          { id: "pre_003", name: "General Physics", subjectName: "Physics" },
        ])
      } catch (error) {
        console.error("Failed to load prerequisite classes:", error)
      } finally {
        setLoading(false)
      }
    }
    loadClasses()
  }, [currentClassId])

  return (
    <FormField
      control={form.control}
      name="prerequisiteId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Prerequisite Course (Optional)</FormLabel>
          <Select
            onValueChange={(value) =>
              field.onChange(value === "none" ? null : value)
            }
            value={field.value || "none"}
            disabled={disabled || loading}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loading ? "Loading..." : "No prerequisite required"
                  }
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="none">No prerequisite required</SelectItem>
              {availableClasses
                .filter((cls) => cls.id !== currentClassId) // Prevent self-reference
                .map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{cls.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {cls.subjectName}
                      </span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <FormDescription>
            Students must complete this course before enrolling
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
