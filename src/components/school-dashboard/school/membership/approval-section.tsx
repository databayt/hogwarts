"use client"

import { useState, useTransition } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"

import { approveMemberRequest, rejectMemberRequest } from "./actions"
import type { MembershipRequestRow } from "./types"

interface ApprovalSectionProps {
  requests: MembershipRequestRow[]
  onSuccess: () => void
  t: Record<string, string>
  lang?: string
}

export function ApprovalSection({
  requests,
  onSuccess,
  t,
  lang,
}: ApprovalSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  if (requests.length === 0) return null

  const handleApprove = (requestId: string) => {
    startTransition(async () => {
      const result = await approveMemberRequest({ requestId })
      if (result.success) {
        SuccessToast(t.requestApproved || "Request approved")
        onSuccess()
      } else {
        ErrorToast(result.error || t.failedToApprove || "Failed to approve")
      }
    })
  }

  const handleRejectSubmit = () => {
    if (!rejectingId || !rejectReason.trim()) return

    startTransition(async () => {
      const result = await rejectMemberRequest({
        requestId: rejectingId,
        reason: rejectReason.trim(),
      })
      if (result.success) {
        SuccessToast(t.requestRejected || "Request rejected")
        setRejectingId(null)
        setRejectReason("")
        onSuccess()
      } else {
        ErrorToast(result.error || t.failedToReject || "Failed to reject")
      }
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {t.pendingRequests || "Pending Requests"}
                <Badge variant="secondary">{requests.length}</Badge>
              </CardTitle>
              <CardDescription>
                {t.pendingRequestsDescription ||
                  "Members waiting for approval to join"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.name || "Name"}</TableHead>
                <TableHead>{t.email || "Email"}</TableHead>
                <TableHead>{t.requestedRole || "Requested Role"}</TableHead>
                <TableHead>{t.joinMethod || "Method"}</TableHead>
                <TableHead>{t.date || "Date"}</TableHead>
                <TableHead className="text-end">
                  {t.actions || "Actions"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.name || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {request.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{request.requestedRole}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {request.joinMethod}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs tabular-nums">
                    {request.createdAt.toLocaleDateString(
                      lang === "ar" ? "ar-SA" : "en-US"
                    )}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        disabled={isPending}
                      >
                        {t.approve || "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectingId(request.id)
                          setRejectReason("")
                        }}
                        disabled={isPending}
                      >
                        {t.reject || "Reject"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog
        open={!!rejectingId}
        onOpenChange={(open) => {
          if (!open) {
            setRejectingId(null)
            setRejectReason("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.rejectMember || "Reject Request"}</DialogTitle>
            <DialogDescription>
              {t.rejectionReasonDescription ||
                "Please provide a reason for rejecting this membership request."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder={
                t.rejectionReasonPlaceholder || "Enter rejection reason..."
              }
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectingId(null)
                setRejectReason("")
              }}
            >
              {t.cancel || "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={isPending || !rejectReason.trim()}
            >
              {isPending
                ? t.processing || "Processing..."
                : t.reject || "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
