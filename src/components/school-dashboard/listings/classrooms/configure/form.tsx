"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { NumberStepper } from "@/components/atom/number-stepper"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { resolveClassroomError } from "../errors"
import {
  generateSections,
  type GradeConfig,
  type RoomTypeOption,
} from "./actions"

interface SchoolDefaults {
  sectionsPerGrade: number
  studentsPerSection: number
}

interface ConfigureFormProps {
  grades: GradeConfig[]
  roomTypes: RoomTypeOption[]
  schoolDefaults?: SchoolDefaults
}

type GradeRow = {
  gradeId: string
  gradeName: string
  gradeNumber: number
  sections: number
  capacityPerSection: number
  roomType: string
  existingSections: number
}

export function ConfigureForm({
  grades,
  roomTypes,
  schoolDefaults,
}: ConfigureFormProps) {
  const { dictionary } = useDictionary()
  const t = dictionary?.messages?.toast
  const d = dictionary?.school?.classrooms?.configure
  const errorsDict = (
    dictionary?.school?.classrooms as
      | { errors?: Record<string, string> }
      | undefined
  )?.errors
  const [isPending, startTransition] = useTransition()
  const defaultRoomType = roomTypes[0]?.id ?? ""

  const [rows, setRows] = useState<GradeRow[]>(
    grades.map((g) => ({
      gradeId: g.gradeId,
      gradeName: g.gradeName,
      gradeNumber: g.gradeNumber,
      sections: Math.max(
        g.existingSections,
        schoolDefaults?.sectionsPerGrade ?? 2
      ),
      capacityPerSection:
        g.maxStudents || schoolDefaults?.studentsPerSection || 30,
      roomType: defaultRoomType,
      existingSections: g.existingSections,
    }))
  )

  const [bulkSections, setBulkSections] = useState(
    schoolDefaults?.sectionsPerGrade ?? 2
  )
  const [bulkCapacity, setBulkCapacity] = useState(
    schoolDefaults?.studentsPerSection ?? 30
  )

  const updateRow = (
    gradeId: string,
    field: keyof GradeRow,
    value: string | number
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.gradeId === gradeId ? { ...r, [field]: value } : r))
    )
  }

  const applyToAll = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        sections: Math.max(r.existingSections, bulkSections),
        capacityPerSection: bulkCapacity,
      }))
    )
  }

  const handleGenerate = (gradeIds?: string[]) => {
    const targetRows = gradeIds
      ? rows.filter((r) => gradeIds.includes(r.gradeId))
      : rows.filter((r) => r.sections > r.existingSections)

    if (targetRows.length === 0) {
      toast.info(
        d?.noChanges ||
          t?.info?.noChanges ||
          "All grades already have the configured number of sections"
      )
      return
    }

    startTransition(async () => {
      const result = await generateSections({
        grades: targetRows.map((r) => ({
          gradeId: r.gradeId,
          sections: r.sections,
          capacityPerSection: r.capacityPerSection,
          roomType: r.roomType,
        })),
      })

      if (result.success && result.data) {
        toast.success(
          t?.success?.created ||
            `Created ${result.data.created} section${result.data.created !== 1 ? "s" : ""} with rooms`
        )
        result.data.details.forEach((detail) => toast.info(detail))
        // Update existing counts
        setRows((prev) =>
          prev.map((r) => {
            const target = targetRows.find((tr) => tr.gradeId === r.gradeId)
            if (target) {
              return { ...r, existingSections: r.sections }
            }
            return r
          })
        )
      } else {
        toast.error(
          resolveClassroomError(
            result.error,
            (result as { details?: string }).details,
            errorsDict,
            t?.error?.serverError ?? "Action failed"
          )
        )
      }
    })
  }

  const needsGeneration = (row: GradeRow) => row.sections > row.existingSections

  return (
    <div className="space-y-6">
      <div className="flex w-full flex-wrap items-center gap-2 p-1">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-sm">
            {d?.sections || "Sections"}
          </span>
          <NumberStepper
            value={bulkSections}
            onChange={setBulkSections}
            min={1}
            max={10}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-sm">
            {dictionary?.school?.classrooms?.capacity || "Capacity"}
          </span>
          <NumberStepper
            value={bulkCapacity}
            onChange={setBulkCapacity}
            min={1}
            max={500}
            step={5}
          />
        </div>

        <Button variant="outline" size="sm" onClick={applyToAll}>
          {d?.applyToAll || "Apply to all"}
        </Button>

        <div className="flex-1" />

        <Button
          size="sm"
          onClick={() => handleGenerate()}
          disabled={isPending || !rows.some(needsGeneration)}
        >
          {isPending
            ? d?.generating || "Generating..."
            : d?.generateAll || "Generate All"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {dictionary?.school?.classrooms?.grade || "Grade"}
              </TableHead>
              <TableHead>{d?.sections || "Sections"}</TableHead>
              <TableHead>
                {d?.capacityPerSection || "Capacity/Section"}
              </TableHead>
              <TableHead>{d?.roomType || "Room Type"}</TableHead>
              <TableHead>{d?.existing || "Existing"}</TableHead>
              <TableHead>{d?.actions || "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  {d?.noGrades ||
                    "No grades configured. Set up academic grades first."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.gradeId}>
                  <TableCell className="font-medium">{row.gradeName}</TableCell>
                  <TableCell>
                    <NumberStepper
                      value={row.sections}
                      onChange={(v) => updateRow(row.gradeId, "sections", v)}
                      min={Math.max(1, row.existingSections)}
                      max={10}
                    />
                  </TableCell>
                  <TableCell>
                    <NumberStepper
                      value={row.capacityPerSection}
                      onChange={(v) =>
                        updateRow(row.gradeId, "capacityPerSection", v)
                      }
                      min={1}
                      max={500}
                      step={5}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.roomType}
                      onValueChange={(v) =>
                        updateRow(row.gradeId, "roomType", v)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue
                          placeholder={d?.roomType || "Select type"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes.map((rt) => (
                          <SelectItem key={rt.id} value={rt.id}>
                            {rt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        row.existingSections >= row.sections
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }
                    >
                      {row.existingSections} section
                      {row.existingSections !== 1 ? "s" : ""}
                      {row.existingSections >= row.sections ? " ✓" : ""}
                    </span>
                  </TableCell>
                  <TableCell>
                    {needsGeneration(row) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleGenerate([row.gradeId])}
                      >
                        +{row.sections - row.existingSections} more
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        {d?.upToDate || "Up to date"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
