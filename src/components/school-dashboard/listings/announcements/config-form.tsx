"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
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
import { AnthropicIcons, Icons } from "@/components/icons"
import {
  updateAnnouncementConfig,
  type AnnouncementConfigData,
} from "@/components/school-dashboard/listings/announcements/actions"
import {
  announcementConfigSchema,
  type AnnouncementConfigFormValues,
} from "@/components/school-dashboard/listings/announcements/validation"

interface ConfigFormProps {
  initialConfig: AnnouncementConfigData
  templates: Array<{ id: string; name: string; type: string }>
  dictionary?: Record<string, any>
}

// Anthropic color palette
const CARD_COLORS = {
  oat: "bg-[#E3DACC]", // Publishing Defaults
  cactus: "bg-[#BCD1CA]", // Notifications
  heather: "bg-[#CBCADB]", // Templates
  coral: "bg-[#D97757]", // Tracking & Retention
}

export function AnnouncementConfigForm({
  initialConfig,
  templates,
  dictionary,
}: ConfigFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<AnnouncementConfigFormValues>({
    resolver: zodResolver(announcementConfigSchema),
    defaultValues: {
      defaultScope: initialConfig.defaultScope as "school" | "class" | "role",
      defaultPriority: initialConfig.defaultPriority as
        | "low"
        | "normal"
        | "high"
        | "urgent",
      autoPublish: initialConfig.autoPublish,
      defaultExpiryDays: initialConfig.defaultExpiryDays,
      emailOnPublish: initialConfig.emailOnPublish,
      pushNotifications: initialConfig.pushNotifications,
      quietHoursStart: initialConfig.quietHoursStart,
      quietHoursEnd: initialConfig.quietHoursEnd,
      digestFrequency: initialConfig.digestFrequency as
        | "none"
        | "daily"
        | "weekly",
      defaultTemplateId: initialConfig.defaultTemplateId,
      allowCustomTemplates: initialConfig.allowCustomTemplates,
      readTracking: initialConfig.readTracking,
      retentionDays: initialConfig.retentionDays,
      autoArchive: initialConfig.autoArchive,
      archiveAfterDays: initialConfig.archiveAfterDays,
    },
  })

  const onSubmit = (data: AnnouncementConfigFormValues) => {
    startTransition(async () => {
      const result = await updateAnnouncementConfig(data)
      if (result.success) {
        toast.success(cfg?.saved || "Settings saved successfully")
      } else {
        toast.error(
          result.error || cfg?.saveFailed || "Failed to save settings"
        )
      }
    })
  }

  // Use nested config dictionary from dictionary?.config, with fallbacks
  const cfg = dictionary?.config as Record<string, string> | undefined
  const ann = dictionary as Record<string, any> | undefined

  const d = {
    publishingDefaults: cfg?.publishingDefaults || "Publishing Defaults",
    notifications: cfg?.notifications || "Notifications",
    templates: cfg?.templates || "Templates",
    trackingRetention: cfg?.trackingRetention || "Tracking & Retention",
    defaultScope: cfg?.defaultScope || "Default Scope",
    defaultPriority: cfg?.defaultPriority || "Default Priority",
    autoPublish: cfg?.autoPublish || "Auto-publish",
    autoPublishDesc:
      cfg?.autoPublishDesc || "Automatically publish new announcements",
    defaultExpiryDays: cfg?.defaultExpiryDays || "Default Expiry (days)",
    emailOnPublish: cfg?.emailOnPublish || "Email on Publish",
    emailOnPublishDesc:
      cfg?.emailOnPublishDesc || "Send email notifications when published",
    pushNotifications: cfg?.pushNotifications || "Push Notifications",
    pushNotificationsDesc:
      cfg?.pushNotificationsDesc || "Send push notifications (coming soon)",
    quietHoursStart: cfg?.quietHoursStart || "Quiet Hours Start",
    quietHoursEnd: cfg?.quietHoursEnd || "Quiet Hours End",
    digestFrequency: cfg?.digestFrequency || "Digest Frequency",
    defaultTemplate: cfg?.defaultTemplate || "Default Template",
    allowCustomTemplates: cfg?.allowCustomTemplates || "Allow Custom Templates",
    allowCustomTemplatesDesc:
      cfg?.allowCustomTemplatesDesc ||
      "Let users create custom announcement templates",
    readTracking: cfg?.readTracking || "Read Tracking",
    readTrackingDesc:
      cfg?.readTrackingDesc || "Track when users read announcements",
    retentionDays: cfg?.retentionDays || "Retention Period (days)",
    autoArchive: cfg?.autoArchive || "Auto-archive",
    autoArchiveDesc:
      cfg?.autoArchiveDesc || "Automatically archive expired announcements",
    archiveAfterDays: cfg?.archiveAfterDays || "Archive After (days)",
    saveChanges: cfg?.saveChanges || "Save Changes",
    saving: cfg?.saving || "Saving...",
    comingSoon: cfg?.comingSoon || "Coming Soon",
    school: ann?.school || "School",
    class: ann?.class || "Class",
    role: ann?.role || "Role",
    low: ann?.low || "Low",
    normal: ann?.normal || "Normal",
    high: ann?.high || "High",
    urgent: ann?.urgent || "Urgent",
    none: cfg?.none || "None",
    daily: cfg?.daily || "Daily",
    weekly: cfg?.weekly || "Weekly",
    noTemplate: cfg?.noTemplate || "No default template",
    templatesCount: cfg?.templatesCount || "templates available",
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Save Button Header */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Icons.loader2 className="me-2 h-4 w-4 animate-spin" />
                {d.saving}
              </>
            ) : (
              <>
                <Icons.save className="me-2 h-4 w-4" />
                {d.saveChanges}
              </>
            )}
          </Button>
        </div>

        {/* 4 Colorful Cards in 2x2 Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Publishing Defaults (Oat) */}
          <div className={`${CARD_COLORS.oat} rounded-lg p-6`}>
            <div className="mb-6 flex items-center gap-3">
              <AnthropicIcons.Announcement className="h-8 w-8" />
              <h3 className="text-xl font-medium">{d.publishingDefaults}</h3>
            </div>
            <div className="space-y-5">
              {/* Default Scope */}
              <FormField
                control={form.control}
                name="defaultScope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {d.defaultScope}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="school">{d.school}</SelectItem>
                        <SelectItem value="class">{d.class}</SelectItem>
                        <SelectItem value="role">{d.role}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Default Priority */}
              <FormField
                control={form.control}
                name="defaultPriority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {d.defaultPriority}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">{d.low}</SelectItem>
                        <SelectItem value="normal">{d.normal}</SelectItem>
                        <SelectItem value="high">{d.high}</SelectItem>
                        <SelectItem value="urgent">{d.urgent}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Auto-publish */}
              <FormField
                control={form.control}
                name="autoPublish"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">
                        {d.autoPublish}
                      </FormLabel>
                      <FormDescription className="text-xs">
                        {d.autoPublishDesc}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Default Expiry Days */}
              <FormField
                control={form.control}
                name="defaultExpiryDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {d.defaultExpiryDays}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        className="bg-background"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 30)
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Card 2: Notifications (Cactus) */}
          <div className={`${CARD_COLORS.cactus} rounded-lg p-6`}>
            <div className="mb-6 flex items-center gap-3">
              <AnthropicIcons.Lightning className="h-8 w-8" />
              <h3 className="text-xl font-medium">{d.notifications}</h3>
            </div>
            <div className="space-y-5">
              {/* Email on Publish */}
              <FormField
                control={form.control}
                name="emailOnPublish"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">
                        {d.emailOnPublish}
                      </FormLabel>
                      <FormDescription className="text-xs">
                        {d.emailOnPublishDesc}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Push Notifications (disabled) */}
              <FormField
                control={form.control}
                name="pushNotifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between opacity-60">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        {d.pushNotifications}
                        <Badge variant="secondary" className="text-xs">
                          {d.comingSoon}
                        </Badge>
                      </FormLabel>
                      <FormDescription className="text-xs">
                        {d.pushNotificationsDesc}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Quiet Hours */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="quietHoursStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        {d.quietHoursStart}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          className="bg-background"
                          value={field.value || "22:00"}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quietHoursEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        {d.quietHoursEnd}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          className="bg-background"
                          value={field.value || "07:00"}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Digest Frequency */}
              <FormField
                control={form.control}
                name="digestFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {d.digestFrequency}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{d.none}</SelectItem>
                        <SelectItem value="daily">{d.daily}</SelectItem>
                        <SelectItem value="weekly">{d.weekly}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Card 3: Templates (Heather) */}
          <div className={`${CARD_COLORS.heather} rounded-lg p-6`}>
            <div className="mb-6 flex items-center gap-3">
              <AnthropicIcons.Copy className="h-8 w-8" />
              <h3 className="text-xl font-medium">{d.templates}</h3>
              <Badge variant="secondary">
                {templates.length} {d.templatesCount}
              </Badge>
            </div>
            <div className="space-y-5">
              {/* Default Template */}
              <FormField
                control={form.control}
                name="defaultTemplateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {d.defaultTemplate}
                    </FormLabel>
                    <Select
                      onValueChange={(val) =>
                        field.onChange(val === "none" ? null : val)
                      }
                      defaultValue={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder={d.noTemplate} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{d.noTemplate}</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Allow Custom Templates */}
              <FormField
                control={form.control}
                name="allowCustomTemplates"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">
                        {d.allowCustomTemplates}
                      </FormLabel>
                      <FormDescription className="text-xs">
                        {d.allowCustomTemplatesDesc}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Card 4: Tracking & Retention (Coral) */}
          <div className={`${CARD_COLORS.coral} rounded-lg p-6`}>
            <div className="mb-6 flex items-center gap-3">
              <AnthropicIcons.ShieldCheck className="h-8 w-8" />
              <h3 className="text-xl font-medium">{d.trackingRetention}</h3>
            </div>
            <div className="space-y-5">
              {/* Read Tracking */}
              <FormField
                control={form.control}
                name="readTracking"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">
                        {d.readTracking}
                      </FormLabel>
                      <FormDescription className="text-xs">
                        {d.readTrackingDesc}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Retention Days */}
              <FormField
                control={form.control}
                name="retentionDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {d.retentionDays}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        className="bg-background"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 90)
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Auto-archive */}
              <FormField
                control={form.control}
                name="autoArchive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">
                        {d.autoArchive}
                      </FormLabel>
                      <FormDescription className="text-xs">
                        {d.autoArchiveDesc}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Archive After Days */}
              <FormField
                control={form.control}
                name="archiveAfterDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {d.archiveAfterDays}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        className="bg-background"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 30)
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </form>
    </Form>
  )
}
