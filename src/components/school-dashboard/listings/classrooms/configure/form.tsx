"use client"

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

import {
  generateSections,
  type GradeConfig,
  type RoomTypeOption,
} from "./actions"

interface ConfigureFormProps {
  grades: GradeConfig[]
  roomTypes: RoomTypeOption[]
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

export function ConfigureForm({ grades, roomTypes }: ConfigureFormProps) {
  const [isPending, startTransition] = useTransition()
  const defaultRoomType = roomTypes[0]?.id ?? ""

  const [rows, setRows] = useState<GradeRow[]>(
    grades.map((g) => ({
      gradeId: g.gradeId,
      gradeName: g.gradeName,
      gradeNumber: g.gradeNumber,
      sections: Math.max(g.existingSections, 2),
      capacityPerSection: g.maxStudents || 30,
      roomType: defaultRoomType,
      existingSections: g.existingSections,
    }))
  )

  const [defaultSections, setDefaultSections] = useState(2)
  const [defaultCapacity, setDefaultCapacity] = useState(30)

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
      toast.info("All grades already have the configured number of sections")
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
          `Created ${result.data.created} section${result.data.created !== 1 ? "s" : ""} with rooms`
        )
        result.data.details.forEach((d) => toast.info(d))
        // Update existing counts
        setRows((prev) =>
          prev.map((r) => {
            const target = targetRows.find((t) => t.gradeId === r.gradeId)
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
            Default sections
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
            Default capacity
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
          Apply Defaults
        </Button>

        <Button
          size="sm"
          onClick={() => handleGenerate()}
          disabled={isPending || !rows.some(needsGeneration)}
        >
          {isPending ? "Generating..." : "Generate All"}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grade</TableHead>
              <TableHead>Sections</TableHead>
              <TableHead>Capacity/Section</TableHead>
              <TableHead>Room Type</TableHead>
              <TableHead>Existing</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No grades configured. Set up academic grades first.
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
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
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
                        Up to date
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
