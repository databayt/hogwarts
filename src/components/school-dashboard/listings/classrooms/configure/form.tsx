"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useDictionary } from "@/components/internationalization/use-dictionary"

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

  const [defaultSections, setDefaultSections] = useState(
    schoolDefaults?.sectionsPerGrade ?? 2
  )
  const [defaultCapacity, setDefaultCapacity] = useState(
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

  const applyDefaults = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        sections: Math.max(r.existingSections, defaultSections),
        capacityPerSection: defaultCapacity,
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

      if (result.success) {
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
        toast.error(result.error)
      }
    })
  }

  const needsGeneration = (row: GradeRow) => row.sections > row.existingSections

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="text-muted-foreground text-sm">
            {d?.defaultSections || "Default sections"}
          </label>
          <Select
            value={String(defaultSections)}
            onValueChange={(v) => setDefaultSections(Number(v))}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-muted-foreground text-sm">
            {d?.defaultCapacity || "Default capacity"}
          </label>
          <Input
            type="number"
            min={1}
            max={500}
            value={defaultCapacity}
            onChange={(e) => setDefaultCapacity(Number(e.target.value) || 30)}
            className="w-24"
          />
        </div>

        <Button variant="outline" size="sm" onClick={applyDefaults}>
          {d?.applyDefaults || "Apply Defaults"}
        </Button>

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

      <div className="rounded-md border">
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
                    <Select
                      value={String(row.sections)}
                      onValueChange={(v) =>
                        updateRow(row.gradeId, "sections", Number(v))
                      }
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(
                          (n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      max={500}
                      value={row.capacityPerSection}
                      onChange={(e) =>
                        updateRow(
                          row.gradeId,
                          "capacityPerSection",
                          Number(e.target.value) || 30
                        )
                      }
                      className="w-20"
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
