"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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

import { bulkUpdateSubjectRooms, type GradeSubjectAssignment } from "./actions"

interface SubjectRoomFormProps {
  grades: GradeSubjectAssignment[]
}

export function SubjectRoomForm({ grades }: SubjectRoomFormProps) {
  const { dictionary } = useDictionary()
  const t = dictionary?.messages?.toast
  const d = dictionary?.school?.classrooms

  const [selectedGradeId, setSelectedGradeId] = useState(
    grades[0]?.gradeId ?? ""
  )
  const [pendingChanges, setPendingChanges] = useState<Map<string, string>>(
    new Map()
  )
  const [isPending, startTransition] = useTransition()

  const selectedGrade = grades.find((g) => g.gradeId === selectedGradeId)

  const handleRoomChange = (
    classId: string,
    currentRoomId: string,
    newRoomId: string
  ) => {
    setPendingChanges((prev) => {
      const next = new Map(prev)
      if (newRoomId === currentRoomId) {
        next.delete(classId)
      } else {
        next.set(classId, newRoomId)
      }
      return next
    })
  }

  const handleSave = () => {
    if (pendingChanges.size === 0) return

    const assignments = Array.from(pendingChanges.entries()).map(
      ([classId, classroomId]) => ({ classId, classroomId })
    )

    startTransition(async () => {
      const result = await bulkUpdateSubjectRooms({ assignments })
      if (result.success) {
        toast.success(
          t?.success?.updated ||
            `Updated ${result.data?.updated} room assignment${result.data?.updated !== 1 ? "s" : ""}`
        )
        setPendingChanges(new Map())
      } else {
        toast.error(result.error || "Failed to update assignments")
      }
    })
  }

  const gradeRooms =
    selectedGrade?.availableRooms.filter((r) => !r.isShared) ?? []
  const sharedRooms =
    selectedGrade?.availableRooms.filter((r) => r.isShared) ?? []

  return (
    <div className="space-y-6">
      {/* Grade selector badges */}
      <div className="flex flex-wrap gap-2">
        {grades.map((grade) => (
          <Badge
            key={grade.gradeId}
            variant={grade.gradeId === selectedGradeId ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedGradeId(grade.gradeId)}
          >
            {grade.gradeName}
            {grade.classes.length > 0 && (
              <span className="ml-1 opacity-60">({grade.classes.length})</span>
            )}
          </Badge>
        ))}
      </div>

      {/* Subject-Room table */}
      {selectedGrade && selectedGrade.classes.length > 0 ? (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{d?.subject || "Subject"}</TableHead>
                  <TableHead>{d?.teacher || "Teacher"}</TableHead>
                  <TableHead>{"Weekly Periods"}</TableHead>
                  <TableHead>{d?.roomName || "Room"}</TableHead>
                  <TableHead>{d?.type || "Type"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedGrade.classes.map((cls) => {
                  const pendingRoomId = pendingChanges.get(cls.classId)
                  const effectiveRoomId = pendingRoomId ?? cls.currentRoomId
                  const isChanged = pendingChanges.has(cls.classId)

                  // Find the effective room for type display
                  const effectiveRoom = selectedGrade.availableRooms.find(
                    (r) => r.id === effectiveRoomId
                  )

                  return (
                    <TableRow
                      key={cls.classId}
                      className={isChanged ? "bg-muted/50" : undefined}
                    >
                      <TableCell className="font-medium">
                        {cls.subjectName}
                      </TableCell>
                      <TableCell>{cls.teacherName}</TableCell>
                      <TableCell>
                        {cls.weeklyPeriods ?? (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={effectiveRoomId}
                          onValueChange={(v) =>
                            handleRoomChange(cls.classId, cls.currentRoomId, v)
                          }
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {gradeRooms.length > 0 && (
                              <SelectGroup>
                                <SelectLabel>
                                  {selectedGrade.gradeName}
                                </SelectLabel>
                                {gradeRooms.map((room) => (
                                  <SelectItem key={room.id} value={room.id}>
                                    {room.roomName}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            )}
                            {sharedRooms.length > 0 && (
                              <SelectGroup>
                                <SelectLabel>
                                  {d?.shared || "Shared"}
                                </SelectLabel>
                                {sharedRooms.map((room) => (
                                  <SelectItem key={room.id} value={room.id}>
                                    {room.roomName} ({room.assignedCount}{" "}
                                    {d?.classes || "classes"})
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {effectiveRoom?.typeName ?? cls.currentRoomType}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isPending || pendingChanges.size === 0}
            >
              {isPending
                ? d?.saving || "Saving..."
                : `${d?.update || "Save"} ${pendingChanges.size > 0 ? `(${pendingChanges.size})` : ""}`}
            </Button>
          </div>
        </>
      ) : (
        <div className="text-muted-foreground py-8 text-center">
          {selectedGrade
            ? "No classes for this grade. Run Configure > Generate Classes first."
            : "Select a grade to view subject assignments."}
        </div>
      )}
    </div>
  )
}
