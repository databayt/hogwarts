// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { assignFee, bulkAssignFees } from "./actions"

interface FeeAssignmentFormProps {
  lang: string
  feeStructures: { id: string; name: string; totalAmount: number }[]
  students: { id: string; givenName: string; surname: string }[]
}

export function FeeAssignmentForm({
  lang,
  feeStructures,
  students,
}: FeeAssignmentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [feeStructureId, setFeeStructureId] = useState("")
  const [finalAmount, setFinalAmount] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  const [academicYear, setAcademicYear] = useState("")
  const [totalDiscount, setTotalDiscount] = useState("")
  const [scholarshipId, setScholarshipId] = useState("")
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

  function handleFeeStructureChange(value: string) {
    setFeeStructureId(value)
    const structure = feeStructures.find((fs) => fs.id === value)
    if (structure) {
      setFinalAmount(String(structure.totalAmount))
    }
  }

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((curr) =>
      curr.includes(studentId)
        ? curr.filter((id) => id !== studentId)
        : [...curr, studentId]
    )
  }

  function toggleAll() {
    setSelectedStudentIds((curr) =>
      curr.length === students.length ? [] : students.map((s) => s.id)
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!feeStructureId || !academicYear || !finalAmount) {
      toast.error("Please fill in all required fields")
      return
    }

    if (selectedStudentIds.length === 0) {
      toast.error("Please select at least one student")
      return
    }

    startTransition(async () => {
      try {
        if (selectedStudentIds.length === 1) {
          const formData = new FormData()
          formData.set("studentId", selectedStudentIds[0])
          formData.set("feeStructureId", feeStructureId)
          formData.set("academicYear", academicYear)
          formData.set("finalAmount", finalAmount)
          if (customAmount) formData.set("customAmount", customAmount)
          if (totalDiscount) formData.set("totalDiscount", totalDiscount)
          if (scholarshipId) formData.set("scholarshipId", scholarshipId)

          const result = await assignFee(formData)
          if (!result.success) {
            toast.error(result.error || "Failed to assign fee")
            return
          }
          toast.success("Fee assigned successfully")
        } else {
          const formData = new FormData()
          formData.set("studentIds", JSON.stringify(selectedStudentIds))
          formData.set("feeStructureId", feeStructureId)
          formData.set("academicYear", academicYear)
          formData.set("finalAmount", finalAmount)

          const result = await bulkAssignFees(formData)
          if (!result.success) {
            toast.error(result.error || "Failed to assign fees")
            return
          }
          toast.success(
            `Fees assigned to ${selectedStudentIds.length} students`
          )
        }

        router.push(`/${lang}/finance/fees/assignments`)
      } catch {
        toast.error("An unexpected error occurred")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fee Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feeStructure">Fee Structure</Label>
            <Select
              value={feeStructureId}
              onValueChange={handleFeeStructureChange}
            >
              <SelectTrigger id="feeStructure">
                <SelectValue placeholder="Select fee structure" />
              </SelectTrigger>
              <SelectContent>
                {feeStructures.map((fs) => (
                  <SelectItem key={fs.id} value={fs.id}>
                    {fs.name} — {fs.totalAmount.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="academicYear">Academic Year</Label>
            <Input
              id="academicYear"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025-2026"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="finalAmount">Final Amount</Label>
              <Input
                id="finalAmount"
                type="number"
                value={finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
                min={0}
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customAmount">Custom Amount (optional)</Label>
              <Input
                id="customAmount"
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Override amount"
                min={0}
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalDiscount">Discount (optional)</Label>
              <Input
                id="totalDiscount"
                type="number"
                value={totalDiscount}
                onChange={(e) => setTotalDiscount(e.target.value)}
                placeholder="0"
                min={0}
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scholarshipId">Scholarship ID (optional)</Label>
              <Input
                id="scholarshipId"
                value={scholarshipId}
                onChange={(e) => setScholarshipId(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Students</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 border-b pb-3">
            <Checkbox
              id="select-all"
              checked={
                students.length > 0 &&
                selectedStudentIds.length === students.length
              }
              onCheckedChange={toggleAll}
            />
            <Label htmlFor="select-all" className="font-medium">
              Select All ({selectedStudentIds.length}/{students.length})
            </Label>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto">
            {students.map((student) => (
              <div key={student.id} className="flex items-center gap-2">
                <Checkbox
                  id={`student-${student.id}`}
                  checked={selectedStudentIds.includes(student.id)}
                  onCheckedChange={() => toggleStudent(student.id)}
                />
                <Label
                  htmlFor={`student-${student.id}`}
                  className="font-normal"
                >
                  {student.givenName} {student.surname}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${lang}/finance/fees/assignments`)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Assigning..."
            : selectedStudentIds.length > 1
              ? `Assign to ${selectedStudentIds.length} Students`
              : "Assign Fee"}
        </Button>
      </div>
    </form>
  )
}
