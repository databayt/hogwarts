"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import type { NotificationTemplate } from "@prisma/client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { Locale } from "@/components/internationalization/config"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"
import { enumLabel } from "@/components/school-dashboard/school/format"

import { createTemplate, updateTemplate } from "./actions"

const NOTIFICATION_TYPES = [
  "announcement",
  "assignment_created",
  "assignment_due",
  "assignment_graded",
  "attendance_alert",
  "event_reminder",
  "fee_due",
  "fee_overdue",
  "grade_posted",
  "system_alert",
] as const

const CHANNELS = ["in_app", "email", "push", "sms"] as const

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: NotificationTemplate
  lang: Locale
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
  lang,
}: Props) {
  const isEditing = !!template
  const dictionary = useDictionaryFallback()
  const t = dictionary.schoolConsole.templates
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const formData = new FormData(e.currentTarget)

    const data = {
      type: formData.get("type") as string,
      channel: formData.get("channel") as string,
      title: formData.get("title") as string,
      body: formData.get("body") as string,
      lang: (formData.get("lang") as string) || "ar",
      emailSubject: (formData.get("emailSubject") as string) || undefined,
      emailBody: (formData.get("emailBody") as string) || undefined,
      active: formData.get("active") === "on",
    }

    startTransition(async () => {
      try {
        if (isEditing) {
          await updateTemplate({ ...data, id: template.id })
        } else {
          await createTemplate(data as any)
        }
        onOpenChange(false)
      } catch (err) {
        console.error("template save failed:", err)
        setError(t.saveFailed)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t.editTemplate : t.createTemplate}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">{t.notificationType}</Label>
              <Select
                name="type"
                defaultValue={template?.type || "announcement"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {enumLabel(t.types, type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel">{t.channel}</Label>
              <Select
                name="channel"
                defaultValue={template?.channel || "email"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((ch) => (
                    <SelectItem key={ch} value={ch}>
                      {enumLabel(t.channels, ch)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">{t.titleLabel}</Label>
            <Input
              id="title"
              name="title"
              defaultValue={template?.title || ""}
              placeholder={t.titlePlaceholder}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">{t.body}</Label>
            <Textarea
              id="body"
              name="body"
              defaultValue={template?.body || ""}
              placeholder={t.bodyPlaceholder}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailSubject">{t.emailSubject}</Label>
            <Input
              id="emailSubject"
              name="emailSubject"
              defaultValue={template?.emailSubject || ""}
              placeholder={t.emailSubjectPlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailBody">{t.emailBody}</Label>
            <Textarea
              id="emailBody"
              name="emailBody"
              defaultValue={template?.emailBody || ""}
              placeholder={t.emailBodyPlaceholder}
              rows={3}
            />
          </div>

          <input type="hidden" name="lang" value={template?.lang || "ar"} />

          <div className="flex items-center gap-2">
            <Switch
              id="active"
              name="active"
              defaultChecked={template?.active ?? true}
            />
            <Label htmlFor="active">{t.active}</Label>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? t.saving
                : isEditing
                  ? t.updateTemplate
                  : t.createTemplate}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
