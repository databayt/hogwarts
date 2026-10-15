"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"
import {
  fill,
  formatConsoleDate,
  formatConsoleNumber,
} from "@/components/school-dashboard/school/format"

import { sendBroadcast } from "./actions"

const ROLES = [
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "STAFF",
  "ADMIN",
  "ACCOUNTANT",
] as const

interface Props {
  /** Grades in order, each with its sections. */
  grades: {
    id: string
    name: string
    sections: { id: string; name: string }[]
  }[]
  recentBatches: (NotificationBatch & {
    creator: { username: string | null; email: string | null } | null
  })[]
  lang: Locale
}

export function BroadcastForm({ grades, recentBatches, lang }: Props) {
  const dictionary = useDictionaryFallback()
  const t = dictionary.schoolConsole.broadcast
  const num = (v: number) => formatConsoleNumber(v, lang)
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
      // "g:<id>" = a whole grade, "s:<id>" = one section
      ...(() => {
        const target = (formData.get("target") as string) || ""
        return {
          targetGradeId: target.startsWith("g:") ? target.slice(2) : undefined,
          targetSectionId: target.startsWith("s:")
            ? target.slice(2)
            : undefined,
        }
      })(),
    }

    startTransition(async () => {
      try {
        const batch = await sendBroadcast(data as any)
        setSuccess(fill(t.sent, { count: num(batch.totalCount || 0) }))
        ;(e.target as HTMLFormElement).reset()
      } catch (err) {
        // Server errors are English codes; show the translated message.
        console.error("sendBroadcast failed:", err)
        setError(t.sendFailed)
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
            {t.sendTitle}
          </CardTitle>
          <CardDescription>{t.sendDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">{t.notificationType}</Label>
              <Select name="type" defaultValue="announcement">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">
                    {t.types.announcement}
                  </SelectItem>
                  <SelectItem value="system_alert">
                    {t.types.system_alert}
                  </SelectItem>
                  <SelectItem value="event_reminder">
                    {t.types.event_reminder}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">{t.titleLabel}</Label>
              <Input
                id="title"
                name="title"
                placeholder={t.titlePlaceholder}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">{t.message}</Label>
              <Textarea
                id="body"
                name="body"
                placeholder={t.messagePlaceholder}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetRole">{t.targetRole}</Label>
                <Select name="targetRole">
                  <SelectTrigger>
                    <SelectValue placeholder={t.allRoles} />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {t.roles[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">{t.gradeOrSection}</Label>
                <Select name="target">
                  <SelectTrigger id="target">
                    <SelectValue placeholder={t.wholeSchool} />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.flatMap((grade) => [
                      <SelectItem key={grade.id} value={`g:${grade.id}`}>
                        {grade.name}
                      </SelectItem>,
                      ...grade.sections.map((section) => (
                        <SelectItem key={section.id} value={`s:${section.id}`}>
                          {section.name}
                        </SelectItem>
                      )),
                    ])}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <Button type="submit" disabled={isPending} className="w-full">
              <Send className="me-2 h-4 w-4" />
              {isPending ? t.sending : t.sendTitle}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Batches */}
      <Card>
        <CardHeader>
          <CardTitle>{t.recentTitle}</CardTitle>
          <CardDescription>{t.recentDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {recentBatches.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t.empty}
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
                      <bdi dir="auto">
                        {batch.creator?.username || batch.creator?.email}
                      </bdi>{" "}
                      &middot; {formatConsoleDate(batch.createdAt, lang)}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {fill(t.sentOf, {
                        sent: num(batch.sentCount),
                        total: num(batch.totalCount),
                      })}
                      {batch.failedCount > 0 &&
                        ` (${fill(t.failedCount, { count: num(batch.failedCount) })})`}
                    </p>
                  </div>
                  <StatusBadge status={batch.status} labels={t.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({
  status,
  labels,
}: {
  status: string
  labels: { done: string; processing: string; failed: string; pending: string }
}) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" /> {labels.done}
        </Badge>
      )
    case "processing":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" /> {labels.processing}
        </Badge>
      )
    case "failed":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" /> {labels.failed}
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" /> {labels.pending}
        </Badge>
      )
  }
}
