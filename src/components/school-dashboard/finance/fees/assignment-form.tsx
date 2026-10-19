// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { actionErrorMessage } from "@/lib/resolve-action-error"
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
import { SuccessToast } from "@/components/atom/toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { assignFee, bulkAssignFees } from "./actions"
import { useFeeStudentSearch, type FeeStudentOption } from "./student-picker"

interface FeeAssignmentFormProps {
  lang: string
  feeStructures: {
    id: string
    name: string
    totalAmount: number
    gradeId: string | null
    gradeName: string | null
  }[]
}

export function FeeAssignmentForm({
  lang,
  feeStructures,
}: FeeAssignmentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { dictionary } = useDictionary()
  const af = (dictionary as any)?.finance?.assignmentForm as
    | Record<string, string>
    | undefined
  const fc = (dictionary as any)?.finance?.common as
    | Record<string, string>
    | undefined

  const [feeStructureId, setFeeStructureId] = useState("")
  const [finalAmount, setFinalAmount] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  const [academicYear, setAcademicYear] = useState("")
  const [totalDiscount, setTotalDiscount] = useState("")
  const [scholarshipId, setScholarshipId] = useState("")
  // Picked students by id — kept across searches, so a selection made from
  // one result list survives typing the next query.
  const [picked, setPicked] = useState<Map<string, FeeStudentOption>>(
    () => new Map()
  )
  const selectedStudentIds = [...picked.keys()]
  const [search, setSearch] = useState("")
  const structure = feeStructures.find((fs) => fs.id === feeStructureId)
  // A structure for a grade lists that grade's students; a search covers
  // the whole school (still within the grade when one is set).
  const { options: students, loading } = useFeeStudentSearch(search, {
    gradeId: structure?.gradeId ?? undefined,
  })

  function handleFeeStructureChange(value: string) {
    setFeeStructureId(value)
    const structure = feeStructures.find((fs) => fs.id === value)
    if (structure) {
      setFinalAmount(String(structure.totalAmount))
    }
  }

  function toggleStudent(student: FeeStudentOption) {
    setPicked((curr) => {
      const next = new Map(curr)
      if (next.has(student.id)) next.delete(student.id)
      else next.set(student.id, student)
      return next
    })
  }

  const allShownPicked =
    students.length > 0 && students.every((s) => picked.has(s.id))

  /** Select or clear every student in the current list. */
  function toggleAll() {
    setPicked((curr) => {
      const next = new Map(curr)
      for (const s of students) {
        if (allShownPicked) next.delete(s.id)
        else next.set(s.id, s)
      }
      return next
    })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!feeStructureId || !academicYear || !finalAmount) {
      toast.error(
        af?.fillRequiredFields || "Please fill in all required fields"
      )
      return
    }

    if (selectedStudentIds.length === 0) {
      toast.error(
        af?.selectAtLeastOneStudent || "Please select at least one student"
      )
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
            toast.error(
              actionErrorMessage(
                result.error,
                dictionary,
                af?.failedAssignFee || "Failed to assign fee"
              )
            )
            return
          }
          SuccessToast(
            af?.feeAssignedSuccessfully || "Fee assigned successfully"
          )
        } else {
          const formData = new FormData()
          formData.set("studentIds", JSON.stringify(selectedStudentIds))
          formData.set("feeStructureId", feeStructureId)
          formData.set("academicYear", academicYear)
          formData.set("finalAmount", finalAmount)

          const result = await bulkAssignFees(formData)
          if (!result.success) {
            toast.error(
              actionErrorMessage(
                result.error,
                dictionary,
                af?.failedAssignFees || "Failed to assign fees"
              )
            )
            return
          }
          SuccessToast(
            (
              af?.feesAssignedToStudents || "Fees assigned to {count} students"
            ).replace("{count}", String(selectedStudentIds.length))
          )
        }

        router.push(`/${lang}/finance/fees/assignments`)
      } catch {
        toast.error(af?.unexpectedError || "An unexpected error occurred")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{af?.feeDetails || "Fee Details"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feeStructure">
              {af?.feeStructure || "Fee Structure"}
            </Label>
            <Select
              value={feeStructureId}
              onValueChange={handleFeeStructureChange}
            >
              <SelectTrigger id="feeStructure">
                <SelectValue
                  placeholder={af?.selectFeeStructure || "Select fee structure"}
                />
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
            <Label htmlFor="academicYear">
              {af?.academicYear || "Academic Year"}
            </Label>
            <Input
              id="academicYear"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder={af?.academicYearPlaceholder || "2025-2026"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="finalAmount">
                {af?.finalAmount || "Final Amount"}
              </Label>
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
              <Label htmlFor="customAmount">
                {af?.customAmount || "Custom Amount (optional)"}
              </Label>
              <Input
                id="customAmount"
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder={af?.overrideAmount || "Override amount"}
                min={0}
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalDiscount">
                {af?.discount || "Discount (optional)"}
              </Label>
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
              <Label htmlFor="scholarshipId">
                {af?.scholarshipId || "Scholarship ID (optional)"}
              </Label>
              <Input
                id="scholarshipId"
                value={scholarshipId}
                onChange={(e) => setScholarshipId(e.target.value)}
                placeholder={af?.optional || "Optional"}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{af?.selectStudents || "Select Students"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              af?.searchStudents || "Search by name or student number…"
            }
            aria-label={af?.searchStudents || "Search students"}
          />

          <div className="flex items-center justify-between gap-2 border-b pb-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={allShownPicked}
                disabled={students.length === 0}
                onCheckedChange={toggleAll}
              />
              <Label htmlFor="select-all" className="font-medium">
                {!search.trim() && structure?.gradeName
                  ? (af?.studentsInGrade || "Students in {grade}").replace(
                      "{grade}",
                      structure.gradeName
                    )
                  : fc?.selectAll || "Select All"}{" "}
                ({loading ? "…" : students.length})
              </Label>
            </div>
            {picked.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">
                  {(af?.selectedCount || "{count} selected").replace(
                    "{count}",
                    String(picked.size)
                  )}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPicked(new Map())}
                >
                  {af?.clearSelection || "Clear"}
                </Button>
              </div>
            )}
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto">
            {students.map((student) => (
              <div key={student.id} className="flex items-center gap-2">
                <Checkbox
                  id={`student-${student.id}`}
                  checked={picked.has(student.id)}
                  onCheckedChange={() => toggleStudent(student)}
                />
                <Label
                  htmlFor={`student-${student.id}`}
                  className="font-normal"
                >
                  <bdi dir="auto">{student.name}</bdi>
                  {student.grade && !structure?.gradeId && (
                    <span className="text-muted-foreground">
                      {" "}
                      — <bdi dir="auto">{student.grade}</bdi>
                    </span>
                  )}
                </Label>
              </div>
            ))}
            {!loading && students.length === 0 && (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {search.trim() || structure?.gradeId
                  ? af?.noMatchingStudents || "No active student matches."
                  : af?.typeToSearch ||
                    "Pick a fee structure for a grade, or search for students."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${lang}/finance/fees/assignments`)}
        >
          {fc?.cancel || "Cancel"}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? af?.assigning || "Assigning..."
            : selectedStudentIds.length > 1
              ? (af?.assignToStudents || "Assign to {count} Students").replace(
                  "{count}",
                  String(selectedStudentIds.length)
                )
              : af?.assignFee || "Assign Fee"}
        </Button>
      </div>
    </form>
  )
}
