"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import type { AnnouncementConfig } from "@prisma/client"
import { Save, Settings } from "lucide-react"

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
import { Switch } from "@/components/ui/switch"
import type { Locale } from "@/components/internationalization/config"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"

import { updateAnnouncementConfig } from "./actions"

interface Props {
  config: AnnouncementConfig
  lang: Locale
}

export function SettingsForm({ config, lang }: Props) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const dictionary = useDictionaryFallback()
  const t = dictionary.schoolConsole.notificationSettings

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSuccess(false)
    setError("")
    const formData = new FormData(e.currentTarget)

    const data = {
      defaultScope: formData.get("defaultScope") as string,
      defaultPriority: formData.get("defaultPriority") as string,
      autoPublish: formData.get("autoPublish") === "on",
      defaultExpiryDays: Number(formData.get("defaultExpiryDays")) || 30,
      emailOnPublish: formData.get("emailOnPublish") === "on",
      pushNotifications: formData.get("pushNotifications") === "on",
      quietHoursStart: (formData.get("quietHoursStart") as string) || undefined,
      quietHoursEnd: (formData.get("quietHoursEnd") as string) || undefined,
      digestFrequency: formData.get("digestFrequency") as string,
      readTracking: formData.get("readTracking") === "on",
      retentionDays: Number(formData.get("retentionDays")) || 90,
      autoArchive: formData.get("autoArchive") === "on",
      archiveAfterDays: Number(formData.get("archiveAfterDays")) || 30,
    }

    startTransition(async () => {
      try {
        await updateAnnouncementConfig(data as any)
        setSuccess(true)
      } catch (err) {
        console.error("updateAnnouncementConfig failed:", err)
        setError(t.saveFailed)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Publishing Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t.publishing.title}
          </CardTitle>
          <CardDescription>{t.publishing.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.publishing.defaultScope}</Label>
              <Select name="defaultScope" defaultValue={config.defaultScope}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">{t.scope.school}</SelectItem>
                  <SelectItem value="grade">{t.scope.grade}</SelectItem>
                  <SelectItem value="section">{t.scope.section}</SelectItem>
                  <SelectItem value="role">{t.scope.role}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.publishing.defaultPriority}</Label>
              <Select
                name="defaultPriority"
                defaultValue={config.defaultPriority}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t.priority.low}</SelectItem>
                  <SelectItem value="normal">{t.priority.normal}</SelectItem>
                  <SelectItem value="high">{t.priority.high}</SelectItem>
                  <SelectItem value="urgent">{t.priority.urgent}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>{t.publishing.autoPublish}</Label>
              <p className="text-muted-foreground text-xs">
                {t.publishing.autoPublishHint}
              </p>
            </div>
            <Switch name="autoPublish" defaultChecked={config.autoPublish} />
          </div>

          <div className="space-y-2">
            <Label>{t.publishing.defaultExpiry}</Label>
            <Input
              name="defaultExpiryDays"
              type="number"
              defaultValue={config.defaultExpiryDays}
              min={1}
              max={365}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t.delivery.title}</CardTitle>
          <CardDescription>{t.delivery.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t.delivery.emailOnPublish}</Label>
              <p className="text-muted-foreground text-xs">
                {t.delivery.emailOnPublishHint}
              </p>
            </div>
            <Switch
              name="emailOnPublish"
              defaultChecked={config.emailOnPublish}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>{t.delivery.push}</Label>
              <p className="text-muted-foreground text-xs">
                {t.delivery.pushHint}
              </p>
            </div>
            <Switch
              name="pushNotifications"
              defaultChecked={config.pushNotifications}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.delivery.quietStart}</Label>
              <Input
                name="quietHoursStart"
                type="time"
                defaultValue={config.quietHoursStart || "22:00"}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.delivery.quietEnd}</Label>
              <Input
                name="quietHoursEnd"
                type="time"
                defaultValue={config.quietHoursEnd || "07:00"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t.delivery.digest}</Label>
            <Select
              name="digestFrequency"
              defaultValue={config.digestFrequency}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t.digest.none}</SelectItem>
                <SelectItem value="daily">{t.digest.daily}</SelectItem>
                <SelectItem value="weekly">{t.digest.weekly}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Retention Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t.retention.title}</CardTitle>
          <CardDescription>{t.retention.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t.retention.readTracking}</Label>
              <p className="text-muted-foreground text-xs">
                {t.retention.readTrackingHint}
              </p>
            </div>
            <Switch name="readTracking" defaultChecked={config.readTracking} />
          </div>

          <div className="space-y-2">
            <Label>{t.retention.period}</Label>
            <Input
              name="retentionDays"
              type="number"
              defaultValue={config.retentionDays}
              min={7}
              max={365}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>{t.retention.autoArchive}</Label>
              <p className="text-muted-foreground text-xs">
                {t.retention.autoArchiveHint}
              </p>
            </div>
            <Switch name="autoArchive" defaultChecked={config.autoArchive} />
          </div>

          <div className="space-y-2">
            <Label>{t.retention.archiveAfter}</Label>
            <Input
              name="archiveAfterDays"
              type="number"
              defaultValue={config.archiveAfterDays}
              min={1}
              max={365}
            />
          </div>
        </CardContent>
      </Card>

      {success && <p className="text-sm text-green-600">{t.saved}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={isPending}>
        <Save className="me-2 h-4 w-4" />
        {isPending ? t.saving : t.save}
      </Button>
    </form>
  )
}
