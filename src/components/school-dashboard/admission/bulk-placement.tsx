"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  getAvailableSectionsForPlacement,
  placeStudentInSection,
} from "./actions"

interface AdmittedStudent {
  applicationId: string
  studentName: string
  applyingForClass: string
  hasPlacement: boolean
}

interface BulkPlacementProps {
  students: AdmittedStudent[]
  onComplete?: () => void
}

export function BulkPlacement({ students, onComplete }: BulkPlacementProps) {
  const [sections, setSections] = useState<
    Array<{
      id: string
      name: string
      enrolledStudents: number
      maxCapacity: number
    }>
  >([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set()
  )
  const [targetSectionId, setTargetSectionId] = useState("")
  const [isPending, startTransition] = useTransition()
  const [placedCount, setPlacedCount] = useState(0)

  const unplacedStudents = students.filter((s) => !s.hasPlacement)

  useEffect(() => {
    // Load sections for all unique grades that unplaced students are applying for
    const uniqueGrades = [
      ...new Set(
        unplacedStudents.map((s) => s.applyingForClass).filter(Boolean)
      ),
    ]
    if (uniqueGrades.length === 0) return

    Promise.all(
      uniqueGrades.map((grade) =>
        getAvailableSectionsForPlacement({ applyingForClass: grade })
      )
    ).then((results) => {
      const allSections = new Map<string, (typeof sections)[number]>()
      for (const res of results) {
        if (res.success && res.data) {
          for (const sec of res.data) {
            allSections.set(sec.id, sec)
          }
        }
      }
      setSections([...allSections.values()])
    })
  }, [unplacedStudents.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleStudent = (applicationId: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev)
      if (next.has(applicationId)) {
        next.delete(applicationId)
      } else {
        next.add(applicationId)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (selectedStudents.size === unplacedStudents.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(unplacedStudents.map((s) => s.applicationId)))
    }
  }

  const handleBulkPlace = () => {
    if (!targetSectionId || selectedStudents.size === 0) return

    startTransition(async () => {
      let successCount = 0
      let errorCount = 0

      for (const applicationId of selectedStudents) {
        const result = await placeStudentInSection({
          applicationId,
          sectionId: targetSectionId,
        })
        if (result.success) {
          successCount++
        } else {
          errorCount++
        }
      }

      setPlacedCount((prev) => prev + successCount)

      if (successCount > 0) {
        toast.success(`${successCount} student(s) placed successfully`)
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} student(s) failed to place`)
      }

      setSelectedStudents(new Set())
      onComplete?.()
    })
  }

  if (unplacedStudents.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border p-4">
        <Check className="text-green-600" />
        <p className="text-sm">
          All admitted students have been placed in sections.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Bulk Section Placement</h3>
          <p className="text-muted-foreground text-sm">
            {unplacedStudents.length} admitted student(s) without section
            placement
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={targetSectionId} onValueChange={setTargetSectionId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Target section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((sec) => {
                const isFull = sec.enrolledStudents >= sec.maxCapacity
                return (
                  <SelectItem key={sec.id} value={sec.id} disabled={isFull}>
                    {sec.name} ({sec.enrolledStudents}/{sec.maxCapacity})
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          <Button
            onClick={handleBulkPlace}
            disabled={
              !targetSectionId || selectedStudents.size === 0 || isPending
            }
          >
            {isPending
              ? "Placing..."
              : `Place ${selectedStudents.size} Student(s)`}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    selectedStudents.size === unplacedStudents.length &&
                    unplacedStudents.length > 0
                  }
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Applying For</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unplacedStudents.map((student) => (
              <TableRow key={student.applicationId}>
                <TableCell>
                  <Checkbox
                    checked={selectedStudents.has(student.applicationId)}
                    onCheckedChange={() => toggleStudent(student.applicationId)}
                  />
                </TableCell>
                <TableCell>{student.studentName}</TableCell>
                <TableCell>{student.applyingForClass}</TableCell>
                <TableCell>
                  <Badge variant="secondary">Admitted</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {placedCount > 0 && (
        <p className="text-muted-foreground text-sm">
          {placedCount} student(s) placed this session.
        </p>
      )}
    </div>
  )
}
