"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { formatDistanceToNow } from "date-fns"
import { Globe } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/icons"

import {
  cancelDomainRequest,
  createDomainRequest,
} from "../../settings/domain-request/actions"

interface DomainRequest {
  id: string
  domain: string
  status: string
  notes?: string | null
  createdAt: Date
  verifiedAt?: Date | null
}

interface ConfigDomainFormProps {
  currentDomain?: string
  existingRequests: DomainRequest[]
  dictionary?: any
}

export function ConfigDomainForm({
  currentDomain,
  existingRequests = [],
  dictionary,
}: ConfigDomainFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const pendingRequest = existingRequests.find((r) => r.status === "pending")
  const approvedRequest = existingRequests.find((r) => r.status === "approved")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      setError("")
      setSuccess("")

      const result = await createDomainRequest(formData)

      if (result.success) {
        setSuccess("Domain request submitted! Review takes 24-48 hours.")
        ;(e.target as HTMLFormElement).reset()
      } else {
        setError(result.error || "Failed to submit domain request")
      }
    })
  }

  const handleCancel = (requestId: string) => {
    startTransition(async () => {
      setError("")
      setSuccess("")

      const result = await cancelDomainRequest(requestId)

      if (result.success) {
        setSuccess("Domain request cancelled.")
      } else {
        setError(result.error || "Failed to cancel request")
      }
    })
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary">
            <Icons.clock className="me-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="default">
            <Icons.circleCheck className="me-1 h-3 w-3" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <Icons.circleX className="me-1 h-3 w-3" />
            Rejected
          </Badge>
        )
      case "verified":
        return (
          <Badge className="bg-green-500">
            <Icons.circleCheck className="me-1 h-3 w-3" />
            Verified
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Current Subdomain (read-only context) */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Current Subdomain</h4>
        <div className="flex items-center gap-2">
          <Globe className="text-muted-foreground h-4 w-4" />
          <code className="bg-muted rounded px-2 py-1 font-mono text-sm">
            {currentDomain}.databayt.org
          </code>
        </div>
        <p className="text-muted-foreground text-xs">
          To change your subdomain, go to the Title section.
        </p>
      </div>

      {/* DNS Instructions for Approved Requests */}
      {approvedRequest && (
        <Alert>
          <Icons.circleCheck className="h-4 w-4" />
          <AlertTitle>Domain Approved</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Your custom domain <strong>{approvedRequest.domain}</strong> has
              been approved. Configure the following DNS records with your
              domain registrar:
            </p>
            <div className="bg-muted mt-2 space-y-1 rounded-md p-3 font-mono text-xs">
              <p>Type: CNAME</p>
              <p>Name: @ (or www)</p>
              <p>Value: cname.databayt.org</p>
            </div>
            <p className="text-muted-foreground text-xs">
              DNS changes may take up to 48 hours to propagate.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Request Form — only when no pending/approved request */}
      {!pendingRequest && !approvedRequest && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Custom Domain</Label>
            <Input
              id="domain"
              name="domain"
              type="text"
              placeholder="comboni.com"
              pattern="^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$"
              required
              disabled={isPending}
              className="font-mono"
            />
            <p className="text-muted-foreground text-xs">
              Enter your full domain name (e.g. comboni.com, myschool.edu.sd)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Additional information..."
              rows={2}
              disabled={isPending}
            />
          </div>

          <Button type="submit" disabled={isPending} size="sm">
            {isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      )}

      {/* Feedback Messages */}
      {error && (
        <Alert variant="destructive">
          <Icons.circleAlert className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50">
          <Icons.circleCheck className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Request History */}
      {existingRequests.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Request History</h4>
          <div className="space-y-2">
            {existingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm">{request.domain}</code>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Requested{" "}
                    {formatDistanceToNow(new Date(request.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                  {request.notes && (
                    <p className="text-muted-foreground text-xs">
                      {request.notes}
                    </p>
                  )}
                </div>
                {request.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancel(request.id)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
