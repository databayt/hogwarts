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
import {
  formatConsoleDate,
  formatConsoleNumber,
} from "@/components/school-dashboard/school/format"

import {
  approveMemberRequest,
  rejectMemberRequest,
  resendInvitation,
} from "./actions"
import { fillT, joinMethodLabel, roleLabel } from "./labels"
import type { MembershipRequestRow } from "./types"

interface ApprovalSectionProps {
  requests: MembershipRequestRow[]
  onSuccess: () => void
  t: Record<string, string>
  lang?: string
}

/**
 * Determine the expiry status for display.
 */
function getExpiryStatus(
  request: MembershipRequestRow
): "expired" | "expiring_soon" | "active" | null {
  if (request.joinMethod !== "INVITATION" || !request.expiresAt) return null

  const now = new Date()
  if (request.expiresAt <= now) return "expired"

  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  if (request.expiresAt <= threeDaysFromNow) return "expiring_soon"

  return "active"
}

function ExpiryBadge({
  request,
  t,
  lang,
}: {
  request: MembershipRequestRow
  t: Record<string, string>
  lang?: string
}) {
  const status = getExpiryStatus(request)
  if (!status) return null

  switch (status) {
    case "expired":
      return <Badge variant="destructive">{t.expired}</Badge>
    case "expiring_soon": {
      const now = new Date()
      const daysLeft = Math.ceil(
        ((request.expiresAt?.getTime() ?? 0) - now.getTime()) /
          (24 * 60 * 60 * 1000)
      )
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-600">
          {fillT(t.expiringSoon, {
            days: formatConsoleNumber(daysLeft, lang ?? "ar"),
          })}
        </Badge>
      )
    }
    case "active":
      return null
  }
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
        SuccessToast(t.requestApproved)
        onSuccess()
      } else {
        ErrorToast(t.failedToApprove)
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
        SuccessToast(t.requestRejected)
        setRejectingId(null)
        setRejectReason("")
        onSuccess()
      } else {
        ErrorToast(t.failedToReject)
      }
    })
  }

  const handleResend = (requestId: string) => {
    startTransition(async () => {
      const result = await resendInvitation({ requestId })
      if (result.success) {
        SuccessToast(t.invitationResent)
        onSuccess()
      } else {
        ErrorToast(t.failedToResend)
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
                {t.pendingRequests}
                <Badge variant="secondary">
                  {formatConsoleNumber(requests.length, lang ?? "ar")}
                </Badge>
              </CardTitle>
              <CardDescription>{t.pendingRequestsDescription}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.name}</TableHead>
                <TableHead>{t.email}</TableHead>
                <TableHead>{t.requestedRole}</TableHead>
                <TableHead>{t.joinMethod}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.date}</TableHead>
                <TableHead className="text-end">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.name || "-"}</TableCell>
                  <TableCell className="text-muted-foreground" dir="ltr">
                    {request.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {roleLabel(t, request.requestedRole)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {joinMethodLabel(t, request.joinMethod)}
                  </TableCell>
                  <TableCell>
                    <ExpiryBadge request={request} t={t} lang={lang} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs tabular-nums">
                    {formatConsoleDate(request.createdAt, lang ?? "ar")}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        disabled={isPending}
                      >
                        {t.approve}
                      </Button>
                      {request.joinMethod === "INVITATION" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResend(request.id)}
                          disabled={isPending || request.resentCount >= 5}
                          title={
                            request.resentCount >= 5
                              ? t.maxResendsReached
                              : undefined
                          }
                        >
                          {t.resend}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectingId(request.id)
                          setRejectReason("")
                        }}
                        disabled={isPending}
                      >
                        {t.reject}
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
            <DialogTitle>{t.rejectMember}</DialogTitle>
            <DialogDescription>
              {t.rejectionReasonDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder={t.rejectionReasonPlaceholder}
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
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={isPending || !rejectReason.trim()}
            >
              {isPending ? t.processing : t.reject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
