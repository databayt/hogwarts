"use client"

import { useState, useTransition } from "react"
import { formatDistanceToNow } from "date-fns"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/icons"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import { cancelDomainRequest, createDomainRequest } from "./actions"

interface DomainRequestFormProps {
  currentDomain?: string
  existingRequests?: Array<{
    id: string
    domain: string
    status: string
    notes?: string | null
    createdAt: Date
    verifiedAt?: Date | null
  }>
  dictionary: Dictionary
  lang: Locale
}

export function DomainRequestForm({
  currentDomain,
  existingRequests = [],
  dictionary,
  lang,
}: DomainRequestFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")

  const pendingRequest = existingRequests.find(
    (req) => req.status === "pending"
  )
  const approvedRequest = existingRequests.find(
    (req) => req.status === "approved"
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      setError("")
      setSuccess("")

      const result = await createDomainRequest(formData)

      if (result.success) {
        setSuccess(
          "Domain request submitted successfully! We'll review it within 24-48 hours."
        )
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
        setSuccess("Domain request cancelled successfully.")
      } else {
        setError(result.error || "Failed to cancel request")
      }
    })
  }

  const getStatusBadge = (status: string) => {
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
    <div className="space-y-6">
      {/* Current Domain */}
      <Card>
        <CardHeader>
          <CardTitle>Current Domain</CardTitle>
          <CardDescription>Your school's current subdomain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Icons.globe className="text-muted-foreground h-4 w-4" />
            <code className="bg-muted rounded px-2 py-1 font-mono text-sm">
              {currentDomain}.databayt.org
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Custom Domain Request Form */}
      {!pendingRequest && !approvedRequest && (
        <Card>
          <CardHeader>
            <CardTitle>Request Custom Domain</CardTitle>
            <CardDescription>
              Request a custom subdomain for your school
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Desired Domain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="domain"
                    name="domain"
                    type="text"
                    placeholder="myschool"
                    pattern="^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$"
                    required
                    disabled={isPending}
                    className="font-mono"
                  />
                  <span className="text-muted-foreground text-sm">
                    .databayt.org
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Use lowercase letters, numbers, and hyphens only. 3-63
                  characters.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Additional information about your domain request..."
                  rows={3}
                  disabled={isPending}
                />
              </div>

              <Alert>
                <Icons.circleAlert className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Domain requests are reviewed within 24-48 hours. Once
                  approved, your new domain will be active immediately.
                </AlertDescription>
              </Alert>

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

              <Button type="submit" disabled={isPending}>
                {isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Existing Requests */}
      {existingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Domain Requests</CardTitle>
            <CardDescription>Your domain request history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {existingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm">
                        {request.domain}.databayt.org
                      </code>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Requested{" "}
                      {formatDistanceToNow(new Date(request.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                    {request.notes && (
                      <p className="text-muted-foreground mt-2 text-sm">
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
