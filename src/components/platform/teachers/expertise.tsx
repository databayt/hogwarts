"use client"

import { useEffect, useState, useTransition } from "react"
import {
  Award,
  BookOpen,
  GraduationCap,
  Loader2,
  Plus,
  Star,
  Trash,
} from "lucide-react"
import { useFieldArray, type UseFormReturn } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

import { getSubjectsForExpertise } from "./actions"
import { EXPERTISE_LEVEL_OPTIONS } from "./config"
import { TeacherFormStepProps } from "./types"

// Subject type for the fetched data
type Subject = {
  id: string
  name: string
  nameAr: string | null
}

export function SubjectExpertiseStep({ form, isView }: TeacherFormStepProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subjectExpertise",
  })

  const [isPending, startTransition] = useTransition()
  const [subjects, setSubjects] = useState<
    Array<{ id: string; name: string; nameAr: string | null }>
  >([])
  const [subjectsByDepartment, setSubjectsByDepartment] = useState<
    Record<string, Subject[]>
  >({})
  const [error, setError] = useState<string | null>(null)

  // Fetch subjects from database on mount
  useEffect(() => {
    startTransition(async () => {
      const result = await getSubjectsForExpertise()
      if (result.success) {
        setSubjects(result.data.subjects)
        setSubjectsByDepartment(result.data.byDepartment)
        setError(null)
      } else {
        setError(result.error)
      }
    })
  }, [])

  const addSubjectExpertise = () => {
    append({
      subjectId: "",
      expertiseLevel: "SECONDARY",
    })
  }

  const getExpertiseIcon = (level: string) => {
    switch (level) {
      case "PRIMARY":
        return <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
      case "CERTIFIED":
        return <Award className="h-4 w-4 text-blue-500" />
      case "SECONDARY":
        return <BookOpen className="h-4 w-4 text-gray-500" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const getExpertiseColor = (level: string) => {
    switch (level) {
      case "PRIMARY":
        return "border-yellow-200 bg-yellow-50"
      case "CERTIFIED":
        return "border-blue-200 bg-blue-50"
      case "SECONDARY":
        return "border-gray-200 bg-gray-50"
      default:
        return ""
    }
  }

  const getSelectedSubjectIds = () => {
    return fields.map((field) =>
      form.watch(`subjectExpertise.${fields.indexOf(field)}.subjectId`)
    )
  }

  const isSubjectAvailable = (subjectId: string) => {
    return !getSelectedSubjectIds().includes(subjectId)
  }

  // Find subject by ID from the fetched list
  const findSubject = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)
  }

  // Get department name for a subject
  const getDepartmentForSubject = (subjectId: string): string | null => {
    for (const [deptName, deptSubjects] of Object.entries(
      subjectsByDepartment
    )) {
      if (deptSubjects.some((s) => s.id === subjectId)) {
        return deptName
      }
    }
    return null
  }

  // Group expertise by level
  const expertiseByLevel = {
    PRIMARY: fields.filter(
      (_, index) =>
        form.watch(`subjectExpertise.${index}.expertiseLevel`) === "PRIMARY"
    ),
    CERTIFIED: fields.filter(
      (_, index) =>
        form.watch(`subjectExpertise.${index}.expertiseLevel`) === "CERTIFIED"
    ),
    SECONDARY: fields.filter(
      (_, index) =>
        form.watch(`subjectExpertise.${index}.expertiseLevel`) === "SECONDARY"
    ),
  }

  // Loading state
  if (isPending && subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading subjects...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <div className="bg-destructive/10 rounded-full p-4">
          <GraduationCap className="text-destructive h-8 w-8" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-destructive font-semibold">
            Failed to Load Subjects
          </h3>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    )
  }

  // No subjects in database
  if (subjects.length === 0 && !isPending) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <div className="bg-muted rounded-full p-4">
          <GraduationCap className="text-muted-foreground h-8 w-8" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="font-semibold">No Subjects Available</h3>
          <p className="text-muted-foreground text-sm">
            Please add subjects to the school first before assigning expertise.
          </p>
        </div>
      </div>
    )
  }

  if (fields.length === 0 && !isView) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <div className="bg-muted rounded-full p-4">
          <GraduationCap className="text-muted-foreground h-8 w-8" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="font-semibold">No Subject Expertise Added</h3>
          <p className="text-muted-foreground text-sm">
            Specify which subjects the teacher can teach and their expertise
            level
          </p>
        </div>
        <Button
          type="button"
          onClick={addSubjectExpertise}
          disabled={isView}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Subject Expertise
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Subject Expertise</h3>
          <p className="text-muted-foreground text-sm">
            Specify teaching subjects and expertise levels
          </p>
        </div>
        {!isView && fields.length < subjects.length && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSubjectExpertise}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Subject
          </Button>
        )}
      </div>

      {/* Summary badges */}
      {fields.length > 0 && (
        <div className="bg-muted/30 flex flex-wrap gap-2 rounded-lg p-3">
          {expertiseByLevel.PRIMARY.length > 0 && (
            <Badge variant="outline" className="gap-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {expertiseByLevel.PRIMARY.length} Primary
            </Badge>
          )}
          {expertiseByLevel.CERTIFIED.length > 0 && (
            <Badge variant="outline" className="gap-1">
              <Award className="h-3 w-3 text-blue-500" />
              {expertiseByLevel.CERTIFIED.length} Certified
            </Badge>
          )}
          {expertiseByLevel.SECONDARY.length > 0 && (
            <Badge variant="outline" className="gap-1">
              <BookOpen className="h-3 w-3 text-gray-500" />
              {expertiseByLevel.SECONDARY.length} Secondary
            </Badge>
          )}
        </div>
      )}

      <div className="max-h-[450px] space-y-3 overflow-y-auto pe-2">
        {fields.map((field, index) => {
          const subjectId = form.watch(`subjectExpertise.${index}.subjectId`)
          const selectedSubject = findSubject(subjectId)
          const expertiseLevel = form.watch(
            `subjectExpertise.${index}.expertiseLevel`
          )
          const departmentName = getDepartmentForSubject(subjectId)

          return (
            <Card
              key={field.id}
              className={cn(
                "transition-colors",
                getExpertiseColor(expertiseLevel)
              )}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-1 items-center gap-3">
                    {getExpertiseIcon(expertiseLevel)}
                    <div className="grid flex-1 grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`subjectExpertise.${index}.subjectId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Subject</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isView}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(subjectsByDepartment).map(
                                  ([department, deptSubjects]) => (
                                    <div key={department}>
                                      <div className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
                                        {department}
                                      </div>
                                      {deptSubjects.map((subject) => (
                                        <SelectItem
                                          key={subject.id}
                                          value={subject.id}
                                          disabled={
                                            !isSubjectAvailable(subject.id) &&
                                            subject.id !== field.value
                                          }
                                        >
                                          {subject.name}
                                          {!isSubjectAvailable(subject.id) &&
                                            subject.id !== field.value && (
                                              <span className="text-muted-foreground ms-2 text-xs">
                                                (Already added)
                                              </span>
                                            )}
                                        </SelectItem>
                                      ))}
                                    </div>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`subjectExpertise.${index}.expertiseLevel`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">
                              Expertise Level
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isView}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {EXPERTISE_LEVEL_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    <div className="flex items-center gap-2">
                                      {getExpertiseIcon(option.value)}
                                      {option.label}
                                    </div>
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

                  {!isView && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash className="text-destructive h-4 w-4" />
                    </Button>
                  )}
                </div>

                {selectedSubject && departmentName && (
                  <div className="mt-3 ps-7">
                    <Badge variant="secondary" className="text-xs">
                      {departmentName}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!isView && fields.length > 0 && fields.length < subjects.length && (
        <Button
          type="button"
          variant="outline"
          onClick={addSubjectExpertise}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Another Subject
        </Button>
      )}

      {fields.length >= subjects.length && subjects.length > 0 && (
        <p className="text-muted-foreground py-2 text-center text-sm">
          All available subjects have been added
        </p>
      )}
    </div>
  )
}
