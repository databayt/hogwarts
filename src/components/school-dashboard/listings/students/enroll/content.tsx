"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import { enrollStudent } from "./actions"

interface Props {
  dictionary: Dictionary["school"]
  lang: Locale
  academicGrades?: Array<{
    id: string
    name: string
    gradeNumber: number
    level: { id: string; name: string } | null
  }>
  classes?: Array<{
    id: string
    name: string
    academicGradeId: string | null
  }>
  batches?: Array<{
    id: string
    name: string
    code: string
    yearLevelId: string
  }>
  students?: Array<{
    id: string
    givenName: string
    surname: string
    academicGradeId: string | null
  }>
}

export default function EnrollStudentContent({
  dictionary,
  lang,
  academicGrades = [],
  classes = [],
  batches = [],
  students = [],
}: Props) {
  const d = dictionary?.students
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [studentId, setStudentId] = useState("")
  const [gradeId, setGradeId] = useState("")
  const [classId, setClassId] = useState("")
  const [batchId, setBatchId] = useState("")

  // Filter classes by selected grade
  const filteredClasses = gradeId
    ? classes.filter((c) => c.academicGradeId === gradeId)
    : classes

  // Filter batches by selected grade's yearLevelId
  const selectedGrade = academicGrades.find((g) => g.id === gradeId)

  const handleEnroll = () => {
    if (!studentId) {
      toast.error("Please select a student")
      return
    }

    startTransition(async () => {
      const result = await enrollStudent({
        studentId,
        academicGradeId: gradeId || undefined,
        classId: classId || undefined,
        batchId: batchId || undefined,
      })

      if (result.success) {
        toast.success("Student enrolled successfully")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to enroll student")
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.enroll?.title || "Enroll Student"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.givenName} {s.surname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grade Selection */}
          {academicGrades.length > 0 && (
            <div className="space-y-2">
              <Label>Academic Grade</Label>
              <Select
                value={gradeId}
                onValueChange={(v) => {
                  setGradeId(v)
                  setClassId("")
                  setBatchId("")
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {academicGrades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                      {grade.level ? ` (${grade.level.name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Class Selection */}
          {filteredClasses.length > 0 && (
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Batch Selection */}
          {batches.length > 0 && (
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select value={batchId} onValueChange={setBatchId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} ({batch.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleEnroll}
            disabled={isPending || !studentId}
            className="w-full"
          >
            {isPending ? "Enrolling..." : "Enroll Student"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
