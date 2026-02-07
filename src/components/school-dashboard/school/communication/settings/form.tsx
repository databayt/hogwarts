"use client"

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

import { updateAnnouncementConfig } from "./actions"

interface Props {
  config: AnnouncementConfig
  lang: Locale
}

export function SettingsForm({ config, lang }: Props) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSuccess(false)
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
      await updateAnnouncementConfig(data as any)
      setSuccess(true)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Publishing Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Publishing Defaults
          </CardTitle>
          <CardDescription>
            Default settings for new announcements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Scope</Label>
              <Select name="defaultScope" defaultValue={config.defaultScope}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">Whole School</SelectItem>
                  <SelectItem value="class">Class</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Priority</Label>
              <Select
                name="defaultPriority"
                defaultValue={config.defaultPriority}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-Publish</Label>
              <p className="text-muted-foreground text-xs">
                Publish announcements immediately without review
              </p>
            </div>
            <Switch name="autoPublish" defaultChecked={config.autoPublish} />
          </div>

          <div className="space-y-2">
            <Label>Default Expiry (days)</Label>
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
          <CardTitle>Notification Delivery</CardTitle>
          <CardDescription>
            How announcements are delivered to users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email on Publish</Label>
              <p className="text-muted-foreground text-xs">
                Send email notifications when announcements are published
              </p>
            </div>
            <Switch
              name="emailOnPublish"
              defaultChecked={config.emailOnPublish}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Push Notifications</Label>
              <p className="text-muted-foreground text-xs">
                Send push notifications (when available)
              </p>
            </div>
            <Switch
              name="pushNotifications"
              defaultChecked={config.pushNotifications}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quiet Hours Start</Label>
              <Input
                name="quietHoursStart"
                type="time"
                defaultValue={config.quietHoursStart || "22:00"}
              />
            </div>
            <div className="space-y-2">
              <Label>Quiet Hours End</Label>
              <Input
                name="quietHoursEnd"
                type="time"
                defaultValue={config.quietHoursEnd || "07:00"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Digest Frequency</Label>
            <Select
              name="digestFrequency"
              defaultValue={config.digestFrequency}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Retention Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Data & Retention</CardTitle>
          <CardDescription>
            Tracking and data retention policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Read Tracking</Label>
              <p className="text-muted-foreground text-xs">
                Track which users have read announcements
              </p>
            </div>
            <Switch name="readTracking" defaultChecked={config.readTracking} />
          </div>

          <div className="space-y-2">
            <Label>Retention Period (days)</Label>
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
              <Label>Auto-Archive</Label>
              <p className="text-muted-foreground text-xs">
                Automatically archive old announcements
              </p>
            </div>
            <Switch name="autoArchive" defaultChecked={config.autoArchive} />
          </div>

          <div className="space-y-2">
            <Label>Archive After (days)</Label>
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

      {success && (
        <p className="text-sm text-green-600">Settings saved successfully!</p>
      )}

      <Button type="submit" disabled={isPending}>
        <Save className="me-2 h-4 w-4" />
        {isPending ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  )
}
