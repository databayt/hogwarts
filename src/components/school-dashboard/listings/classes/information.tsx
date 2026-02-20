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
import { getSubjects } from "@/components/school-dashboard/listings/subjects/actions"
import { getTeachers } from "@/components/school-dashboard/listings/teachers/actions"

import { getAcademicGrades } from "./grade-actions"
import { ClassFormStepProps } from "./types"
import { classCreateSchema } from "./validation"

export function InformationStep({ form, isView }: ClassFormStepProps) {
  const [subjects, setSubjects] = useState<
    Array<{ id: string; subjectName: string }>
  >([])
  const [teachers, setTeachers] = useState<
    Array<{ id: string; givenName: string; surname: string }>
  >([])
  const [grades, setGrades] = useState<
    Array<{ id: string; name: string; gradeNumber: number }>
  >([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        // Load subjects, teachers, and grades in parallel
        const [subjectsRes, teachersRes, gradesRes] = await Promise.all([
          getSubjects({ perPage: 100 }),
          getTeachers({ perPage: 100 }),
          getAcademicGrades(),
        ])

        if (subjectsRes.success && subjectsRes.data) {
          setSubjects(
            subjectsRes.data.rows.map((s: any) => ({
              id: s.id,
              subjectName: s.subjectName || s.name || "Unknown",
            }))
          )
        }

        if (teachersRes.success && teachersRes.data) {
          setTeachers(
            teachersRes.data.rows.map((t: any) => ({
              id: t.id,
              givenName: t.givenName || "",
              surname: t.surname || "",
            }))
          )
        }

        if (gradesRes.success && gradesRes.data) {
          setGrades(gradesRes.data)
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="w-full space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Class Name</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter class name"
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
        name="subjectId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subject</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isView}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.subjectName}
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
        name="teacherId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Teacher</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isView}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.givenName} {teacher.surname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {grades.length > 0 && (
        <FormField
          control={form.control}
          name="gradeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grade</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
                disabled={isView}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select grade (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )
}
