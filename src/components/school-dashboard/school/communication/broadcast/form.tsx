"use client"

import { useState, useTransition } from "react"
import type { NotificationBatch } from "@prisma/client"
import { CheckCircle, Clock, Send, XCircle } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Locale } from "@/components/internationalization/config"

import { sendBroadcast } from "./actions"

const ROLES = [
  { value: "TEACHER", label: "Teachers" },
  { value: "STUDENT", label: "Students" },
  { value: "GUARDIAN", label: "Guardians" },
  { value: "STAFF", label: "Staff" },
  { value: "ADMIN", label: "Admins" },
  { value: "ACCOUNTANT", label: "Accountants" },
] as const

interface Props {
  classes: { id: string; name: string }[]
  recentBatches: (NotificationBatch & {
    creator: { username: string | null; email: string | null } | null
  })[]
  lang: Locale
}

export function BroadcastForm({ classes, recentBatches, lang }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    const formData = new FormData(e.currentTarget)

    const data = {
      type: (formData.get("type") as string) || "announcement",
      title: formData.get("title") as string,
      body: formData.get("body") as string,
      targetRole: (formData.get("targetRole") as string) || undefined,
      targetClassId: (formData.get("targetClassId") as string) || undefined,
    }

    startTransition(async () => {
      try {
        const batch = await sendBroadcast(data as any)
        setSuccess(
          `Broadcast sent! ${batch.totalCount || 0} notifications created.`
        )
        ;(e.target as HTMLFormElement).reset()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to send broadcast"
        )
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Send Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Broadcast
          </CardTitle>
          <CardDescription>
            Send a notification to a group of users by role or class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Notification Type</Label>
              <Select name="type" defaultValue="announcement">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="system_alert">System Alert</SelectItem>
                  <SelectItem value="event_reminder">Event Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Broadcast title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                name="body"
                placeholder="Type your broadcast message..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetRole">Target Role (optional)</Label>
                <Select name="targetRole">
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetClassId">Target Class (optional)</Label>
                <Select name="targetClassId">
                  <SelectTrigger>
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <Button type="submit" disabled={isPending} className="w-full">
              <Send className="me-2 h-4 w-4" />
              {isPending ? "Sending..." : "Send Broadcast"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Batches */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Broadcasts</CardTitle>
          <CardDescription>Last 10 broadcast messages</CardDescription>
        </CardHeader>
        <CardContent>
          {recentBatches.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No broadcasts sent yet
            </p>
          ) : (
            <div className="space-y-3">
              {recentBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{batch.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {batch.creator?.username || batch.creator?.email} &middot;{" "}
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {batch.sentCount}/{batch.totalCount} sent
                      {batch.failedCount > 0 &&
                        ` (${batch.failedCount} failed)`}
                    </p>
                  </div>
                  <StatusBadge status={batch.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" /> Done
        </Badge>
      )
    case "processing":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" /> Processing
        </Badge>
      )
    case "failed":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" /> Failed
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      )
  }
}
