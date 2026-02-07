"use client"

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
        setError(err instanceof Error ? err.message : "An error occurred")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Template" : "Create Template"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Notification Type</Label>
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
                      {type.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel">Channel</Label>
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
                      {ch.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={template?.title || ""}
              placeholder="Notification title (supports {{variable}} placeholders)"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              name="body"
              defaultValue={template?.body || ""}
              placeholder="Notification body text..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailSubject">Email Subject (optional)</Label>
            <Input
              id="emailSubject"
              name="emailSubject"
              defaultValue={template?.emailSubject || ""}
              placeholder="Custom email subject line"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailBody">Email Body (optional)</Label>
            <Textarea
              id="emailBody"
              name="emailBody"
              defaultValue={template?.emailBody || ""}
              placeholder="Custom HTML email body..."
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
            <Label htmlFor="active">Active</Label>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : isEditing
                  ? "Update Template"
                  : "Create Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
