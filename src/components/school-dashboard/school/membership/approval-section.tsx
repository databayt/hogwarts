"use client"

import { useTransition } from "react"

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ErrorToast } from "@/components/atom/toast"

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

  if (requests.length === 0) return null

  const handleApprove = (requestId: string) => {
    startTransition(async () => {
      const result = await approveMemberRequest({ requestId })
      if (result.success) {
        onSuccess()
      } else {
        ErrorToast(result.error || t.failedToApprove || "Failed to approve")
      }
    })
  }

  const handleReject = (requestId: string) => {
    const reason = prompt(t.enterRejectionReason || "Enter rejection reason:")
    if (!reason) return

    startTransition(async () => {
      const result = await rejectMemberRequest({ requestId, reason })
      if (result.success) {
        onSuccess()
      } else {
        ErrorToast(result.error || t.failedToReject || "Failed to reject")
      }
    })
  }

  return (
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
                      onClick={() => handleReject(request.id)}
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
  )
}
