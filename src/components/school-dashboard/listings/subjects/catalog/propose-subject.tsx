"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import {
  getMyProposals,
  submitSubjectProposal,
  type ProposalListItem,
} from "./proposal-actions"

// ============================================================================
// Status badge color mapping
// ============================================================================

const statusColors: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SUBMITTED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  IN_REVIEW:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  PUBLISHED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
}

// ============================================================================
// Proposal form
// ============================================================================

function ProposalForm({ onSuccess }: { onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [department, setDepartment] = useState("")
  const [description, setDescription] = useState("")
  const [country, setCountry] = useState("SD")
  const [gradesInput, setGradesInput] = useState("")
  const [level, setLevel] = useState("")

  const handleSubmit = () => {
    if (!name.trim() || !department.trim()) {
      toast.error("Subject name and department are required")
      return
    }

    const grades = gradesInput
      .split(",")
      .map((g) => parseInt(g.trim(), 10))
      .filter((n) => !isNaN(n))

    startTransition(async () => {
      const res = await submitSubjectProposal({
        name: name.trim(),
        department: department.trim(),
        description: description.trim() || undefined,
        grades,
        levels: level ? [level] : [],
        country,
      })

      if (res.success) {
        toast.success("Subject proposal submitted for review")
        setName("")
        setDepartment("")
        setDescription("")
        setGradesInput("")
        onSuccess()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="font-semibold">Propose a New Subject</h3>
      <p className="text-muted-foreground text-sm">
        Submit a subject that doesn&apos;t exist in the catalog. It will be
        reviewed by the platform team and, if approved, added to the global
        catalog for all schools.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="proposal-name">Subject Name</Label>
          <Input
            id="proposal-name"
            placeholder="e.g. Advanced Chemistry"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="proposal-department">Department</Label>
          <Input
            id="proposal-department"
            placeholder="e.g. Sciences"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="proposal-country">Country</Label>
          <Select
            value={country}
            onValueChange={setCountry}
            disabled={isPending}
          >
            <SelectTrigger id="proposal-country">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SD">Sudan</SelectItem>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="GB">United Kingdom</SelectItem>
              <SelectItem value="SA">Saudi Arabia</SelectItem>
              <SelectItem value="AE">UAE</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="proposal-level">School Level</Label>
          <Select value={level} onValueChange={setLevel} disabled={isPending}>
            <SelectTrigger id="proposal-level">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ELEMENTARY">Elementary</SelectItem>
              <SelectItem value="MIDDLE">Middle</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="proposal-grades">Grades (comma-separated)</Label>
          <Input
            id="proposal-grades"
            placeholder="e.g. 9, 10, 11, 12"
            value={gradesInput}
            onChange={(e) => setGradesInput(e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proposal-description">Description</Label>
        <Textarea
          id="proposal-description"
          placeholder="Brief description of the subject and why it should be added..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPending}
          rows={3}
        />
      </div>

      <Button onClick={handleSubmit} disabled={isPending}>
        {isPending ? "Submitting..." : "Submit Proposal"}
      </Button>
    </div>
  )
}

// ============================================================================
// Proposals list
// ============================================================================

function ProposalsList({ proposals }: { proposals: ProposalListItem[] }) {
  if (proposals.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No proposals yet. Use the form above to propose a new subject.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {proposals.map((p) => {
        const data = p.data as { name?: string; department?: string }
        return (
          <div
            key={p.id}
            className="flex items-start justify-between rounded-lg border p-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{data.name || "Untitled"}</span>
                <Badge variant="outline" className="text-xs capitalize">
                  {p.type.toLowerCase()}
                </Badge>
                <Badge className={statusColors[p.status] || ""}>
                  {p.status.replace("_", " ")}
                </Badge>
              </div>
              {data.department && (
                <p className="text-muted-foreground text-sm">
                  Department: {data.department}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                Submitted {new Date(p.createdAt).toLocaleDateString()}
              </p>
              {p.rejectionReason && (
                <p className="text-sm text-red-600">
                  Rejection: {p.rejectionReason}
                </p>
              )}
              {p.reviewNotes && (
                <p className="text-muted-foreground text-sm">
                  Review notes: {p.reviewNotes}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// Main component
// ============================================================================

export function ProposeSubjectPanel() {
  const [proposals, setProposals] = useState<ProposalListItem[]>([])

  const loadProposals = async () => {
    const res = await getMyProposals()
    if (res.success) {
      setProposals(res.data ?? [])
    }
  }

  useEffect(() => {
    loadProposals()
  }, [])

  return (
    <div className="space-y-6">
      <ProposalForm onSuccess={loadProposals} />

      <div className="space-y-3">
        <h3 className="font-semibold">My Proposals</h3>
        <ProposalsList proposals={proposals} />
      </div>
    </div>
  )
}
