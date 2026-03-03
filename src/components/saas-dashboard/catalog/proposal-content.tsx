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
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

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
  dictionary,
}: {
  proposal: ProposalReviewItem
  onRefresh: () => void
  dictionary?: Dictionary
}) {
  const d = dictionary?.operator?.catalog
  const actions = dictionary?.operator?.common?.actions
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
        toast.success(
          d?.approvedAndPublished ||
            "Proposal approved and published to catalog"
        )
        onRefresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error(
        d?.rejectionReasonRequired || "Please provide a rejection reason"
      )
      return
    }
    startTransition(async () => {
      const res = await rejectProposal(proposal.id, rejectionReason)
      if (res.success) {
        toast.success(d?.proposalRejected || "Proposal rejected")
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
        <TableCell className="font-medium">
          {data.name || d?.untitled || "Untitled"}
        </TableCell>
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
                placeholder={
                  d?.reviewNotesPlaceholder || "Review notes (optional)"
                }
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="h-8 w-40"
                disabled={isPending}
              />
              <Button size="sm" onClick={handleApprove} disabled={isPending}>
                {actions?.approve || "Approve"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowReject(!showReject)}
                disabled={isPending}
              >
                {actions?.reject || "Reject"}
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
                placeholder={
                  d?.rejectionReasonPlaceholder || "Rejection reason (required)"
                }
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
                {d?.confirmReject || "Confirm Reject"}
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
                {actions?.cancel || "Cancel"}
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

interface ProposalReviewContentProps {
  dictionary?: Dictionary
  lang?: Locale
}

export function ProposalReviewContent({
  dictionary,
  lang,
}: ProposalReviewContentProps) {
  const d = dictionary?.operator?.catalog
  const [proposals, setProposals] = useState<ProposalReviewItem[]>([])
  const [statusFilter, setStatusFilter] = useState("SUBMITTED")
  const [isLoading, setIsLoading] = useState(true)

  const loadProposals = async () => {
    setIsLoading(true)
    const res = await getProposalsForReview(
      statusFilter === "ALL" ? undefined : statusFilter
    )
    if (res.success) {
      setProposals(res.data ?? [])
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
          <h2 className="text-lg font-semibold">
            {d?.proposals || "Catalog Proposals"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {d?.proposalsDescription ||
              "Review subject/chapter/lesson proposals from schools"}
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{d?.statusAll || "All"}</SelectItem>
            <SelectItem value="SUBMITTED">
              {d?.statusSubmitted || "Submitted"}
            </SelectItem>
            <SelectItem value="IN_REVIEW">
              {d?.statusInReview || "In Review"}
            </SelectItem>
            <SelectItem value="APPROVED">
              {d?.statusApproved || "Approved"}
            </SelectItem>
            <SelectItem value="REJECTED">
              {d?.statusRejected || "Rejected"}
            </SelectItem>
            <SelectItem value="PUBLISHED">
              {d?.statusPublished || "Published"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {d?.loadingProposals || "Loading proposals..."}
        </p>
      ) : proposals.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {d?.noProposalsForFilter ||
            "No proposals found for the selected filter."}
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{d?.name || "Name"}</TableHead>
                <TableHead>{d?.type || "Type"}</TableHead>
                <TableHead>{d?.department || "Department"}</TableHead>
                <TableHead>{d?.school || "School"}</TableHead>
                <TableHead>{d?.status || "Status"}</TableHead>
                <TableHead>{d?.submitted || "Submitted"}</TableHead>
                <TableHead>{d?.actions || "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((p) => (
                <ProposalReviewRow
                  key={p.id}
                  proposal={p}
                  onRefresh={loadProposals}
                  dictionary={dictionary}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
