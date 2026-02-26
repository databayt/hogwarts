"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import { type UseFormReturn } from "react-hook-form"

import {
  FormControl,
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

import {
  getSchoolAssignments,
  getSchoolClasses,
  getSchoolStudents,
} from "./data-fetchers"
import { ResultFormStepProps } from "./types"

export function StudentAssignmentStep({
  form,
  isView,
  dictionary,
}: ResultFormStepProps) {
  const [students, setStudents] = useState<
    Array<{ id: string; givenName: string; surname: string }>
  >([])
  const [assignments, setAssignments] = useState<
    Array<{ id: string; title: string; totalPoints: number }>
  >([])
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>(
    []
  )
  const [isLoading, startTransition] = useTransition()

  const selectedClassId = form.watch("classId")

  useEffect(() => {
    startTransition(async () => {
      try {
        const [classData, studentData, assignmentData] = await Promise.all([
          getSchoolClasses(),
          getSchoolStudents(selectedClassId || undefined),
          getSchoolAssignments(selectedClassId || undefined),
        ])

        if (classData.success && classData.data) {
          setClasses(classData.data)
        }
        if (studentData.success && studentData.data) {
          setStudents(studentData.data)
        }
        if (assignmentData.success && assignmentData.data) {
          setAssignments(assignmentData.data)
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      }
    })
  }, [selectedClassId])

  // Auto-populate maxScore when assignment changes
  const selectedAssignmentId = form.watch("assignmentId")
  const selectedAssignment = assignments.find(
    (a) => a.id === selectedAssignmentId
  )

  useEffect(() => {
    if (selectedAssignment && !isView) {
      form.setValue("maxScore", selectedAssignment.totalPoints)
    }
  }, [selectedAssignment, form, isView])

  return (
    <div className="w-full space-y-4">
      <FormField
        control={form.control}
        name="classId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{dictionary.class}</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isView}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={dictionary.selectClass} />
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

      <FormField
        control={form.control}
        name="studentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{dictionary.student}</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isView || isLoading}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      isLoading ? "Loading..." : dictionary.selectStudent
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.givenName} {student.surname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="assignmentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{dictionary.assignment}</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isView || isLoading}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      isLoading ? "Loading..." : dictionary.selectAssignment
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {assignments.map((assignment) => (
                  <SelectItem key={assignment.id} value={assignment.id}>
                    {assignment.title} ({assignment.totalPoints}{" "}
                    {dictionary.points})
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
