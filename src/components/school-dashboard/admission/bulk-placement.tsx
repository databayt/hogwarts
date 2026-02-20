"use client"

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

import { getAvailableClassesForPlacement, placeStudentInClass } from "./actions"

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
  const [classes, setClasses] = useState<
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
  const [targetClassId, setTargetClassId] = useState("")
  const [isPending, startTransition] = useTransition()
  const [placedCount, setPlacedCount] = useState(0)

  const unplacedStudents = students.filter((s) => !s.hasPlacement)

  useEffect(() => {
    getAvailableClassesForPlacement({ applyingForClass: "" }).then((res) => {
      if (res.success && res.data) {
        setClasses(res.data)
      }
    })
  }, [])

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
    if (!targetClassId || selectedStudents.size === 0) return

    startTransition(async () => {
      let successCount = 0
      let errorCount = 0

      for (const applicationId of selectedStudents) {
        const result = await placeStudentInClass({
          applicationId,
          classId: targetClassId,
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
          All admitted students have been placed in classes.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Bulk Class Placement</h3>
          <p className="text-muted-foreground text-sm">
            {unplacedStudents.length} admitted student(s) without class
            placement
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={targetClassId} onValueChange={setTargetClassId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Target class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => {
                const isFull = cls.enrolledStudents >= cls.maxCapacity
                return (
                  <SelectItem key={cls.id} value={cls.id} disabled={isFull}>
                    {cls.name} ({cls.enrolledStudents}/{cls.maxCapacity})
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          <Button
            onClick={handleBulkPlace}
            disabled={
              !targetClassId || selectedStudents.size === 0 || isPending
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
