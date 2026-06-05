"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Mail, MessageSquare, Phone, RefreshCw, Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { logOperatorActivity, type OperatorLeadActivity } from "./actions"

const ACTIVITY_TYPES = [
  "call",
  "email_sent",
  "meeting",
  "note",
  "status_change",
] as const

type ActivityType = (typeof ACTIVITY_TYPES)[number]

function activityIcon(type: string) {
  switch (type) {
    case "call":
      return Phone
    case "email_sent":
      return Mail
    case "meeting":
      return Users
    case "status_change":
      return RefreshCw
    default:
      return MessageSquare
  }
}

interface Props {
  leadId: string
  activities: OperatorLeadActivity[]
  dictionary?: Dictionary["sales"]
  lang: Locale
}

export function LeadActivityLog({
  leadId,
  activities,
  dictionary,
  lang,
}: Props) {
  const router = useRouter()
  const [type, setType] = useState<ActivityType>("call")
  const [description, setDescription] = useState("")
  const [nextFollowUp, setNextFollowUp] = useState("")
  const [pending, startTransition] = useTransition()

  const a = dictionary?.activity
  const isRTL = lang === "ar"

  const t = {
    title: a?.title ?? "Activity",
    empty:
      a?.empty ??
      "No activity logged yet. Log every touch so the cadence stays honest.",
    logTitle: a?.logTitle ?? "Log a touch",
    logSubtitle:
      a?.logSubtitle ?? "Email, call, meeting, note, or status change.",
    typeLabel: a?.typeLabel ?? "Type",
    descriptionLabel: a?.descriptionLabel ?? "What happened",
    descriptionPlaceholder:
      a?.descriptionPlaceholder ?? "Short summary — who, what, outcome.",
    nextFollowUpLabel: a?.nextFollowUpLabel ?? "Schedule next follow-up",
    submit: a?.submit ?? "Log",
    submitting: a?.submitting ?? "Logging...",
    logSuccess: a?.logSuccess ?? "Activity logged",
    logError: a?.logError ?? "Could not log activity",
    types: {
      email_sent: a?.types?.email_sent ?? "Email",
      call: a?.types?.call ?? "Call",
      meeting: a?.types?.meeting ?? "Meeting",
      note: a?.types?.note ?? "Note",
      status_change: a?.types?.status_change ?? "Status change",
    } satisfies Record<ActivityType, string>,
  }

  const onSubmit = () => {
    if (!description.trim()) {
      toast.error(t.logError)
      return
    }
    startTransition(async () => {
      const followUpDate = nextFollowUp ? new Date(nextFollowUp) : undefined
      const res = await logOperatorActivity(leadId, {
        type,
        description: description.trim(),
        // `undefined` = don't touch; `null` = clear; a Date = set.
        nextFollowUpAt: followUpDate,
      })
      if (res.success) {
        toast.success(t.logSuccess)
        setDescription("")
        setNextFollowUp("")
        router.refresh()
      } else {
        toast.error(res.error || t.logError)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Log form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.logTitle}</CardTitle>
          <p className="text-muted-foreground text-sm">{t.logSubtitle}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t.typeLabel}</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as ActivityType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((typeKey) => (
                    <SelectItem key={typeKey} value={typeKey}>
                      {t.types[typeKey]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.nextFollowUpLabel}</Label>
              <Input
                type="date"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t.descriptionLabel}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.descriptionPlaceholder}
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={onSubmit} disabled={pending}>
              {pending ? t.submitting : t.submit}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              {t.empty}
            </p>
          ) : (
            <ol className="space-y-4">
              {activities.map((act) => {
                const Icon = activityIcon(act.type)
                return (
                  <li key={act.id} className="flex gap-3">
                    <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                          {t.types[act.type as ActivityType] ?? act.type}
                        </span>
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {new Date(act.createdAt).toLocaleString(
                            isRTL ? "ar-SA" : "en-US",
                            {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }
                          )}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {act.description}
                      </p>
                      {act.createdBy && (
                        <p className="text-muted-foreground text-xs">
                          {act.createdBy.username ?? act.createdBy.email}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
