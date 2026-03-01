"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"

import {
  approveProposal,
  getProposalsForReview,
  rejectProposal,
  type ProposalReviewItem,
} from "./proposal-actions"

// ============================================================================
// Status badge
// ============================================================================

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  SUBMITTED: "default",
  IN_REVIEW: "secondary",
  APPROVED: "outline",
  REJECTED: "destructive",
  PUBLISHED: "outline",
  DRAFT: "secondary",
}

// ============================================================================
// Review row with approve/reject actions
// ============================================================================

function ProposalReviewRow({
  proposal,
  onRefresh,
}: {
  proposal: ProposalReviewItem
  onRefresh: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [rejectionReason, setRejectionReason] = useState("")
  const [showReject, setShowReject] = useState(false)
  const [reviewNotes, setReviewNotes] = useState("")
  const data = proposal.data as Record<string, any>

  const canReview =
    proposal.status === "SUBMITTED" || proposal.status === "IN_REVIEW"

  const handleApprove = () => {
    startTransition(async () => {
      const res = await approveProposal(proposal.id, reviewNotes || undefined)
      if (res.success) {
        toast.success("Proposal approved and published to catalog")
        onRefresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason")
      return
    }
    startTransition(async () => {
      const res = await rejectProposal(proposal.id, rejectionReason)
      if (res.success) {
        toast.success("Proposal rejected")
        setShowReject(false)
        setRejectionReason("")
        onRefresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{data.name || "Untitled"}</TableCell>
        <TableCell>
          <Badge variant="outline" className="capitalize">
            {proposal.type.toLowerCase()}
          </Badge>
        </TableCell>
        <TableCell>{data.department || "-"}</TableCell>
        <TableCell>{proposal.schoolName}</TableCell>
        <TableCell>
          <Badge variant={statusVariant[proposal.status] || "secondary"}>
            {proposal.status.replace("_", " ")}
          </Badge>
        </TableCell>
        <TableCell>
          {new Date(proposal.createdAt).toLocaleDateString()}
        </TableCell>
        <TableCell>
          {canReview && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Review notes (optional)"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="h-8 w-40"
                disabled={isPending}
              />
              <Button size="sm" onClick={handleApprove} disabled={isPending}>
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowReject(!showReject)}
                disabled={isPending}
              >
                Reject
              </Button>
            </div>
          )}
        </TableCell>
      </TableRow>

      {showReject && (
        <TableRow>
          <TableCell colSpan={7}>
            <div className="flex items-center gap-2 py-2">
              <Textarea
                placeholder="Rejection reason (required)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                className="flex-1"
                disabled={isPending}
              />
              <Button
                size="sm"
                variant="destructive"
                onClick={handleReject}
                disabled={isPending}
              >
                Confirm Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowReject(false)
                  setRejectionReason("")
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

// ============================================================================
// Main content component
// ============================================================================

export function ProposalReviewContent() {
  const [proposals, setProposals] = useState<ProposalReviewItem[]>([])
  const [statusFilter, setStatusFilter] = useState("SUBMITTED")
  const [isLoading, setIsLoading] = useState(true)

  const loadProposals = async () => {
    setIsLoading(true)
    const res = await getProposalsForReview(
      statusFilter === "ALL" ? undefined : statusFilter
    )
    if (res.success) {
      setProposals(res.data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadProposals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Catalog Proposals</h2>
          <p className="text-muted-foreground text-sm">
            Review subject/chapter/lesson proposals from schools
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="IN_REVIEW">In Review</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Loading proposals...
        </p>
      ) : proposals.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No proposals found for the selected filter.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((p) => (
                <ProposalReviewRow
                  key={p.id}
                  proposal={p}
                  onRefresh={loadProposals}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
