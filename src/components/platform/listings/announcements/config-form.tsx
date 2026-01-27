"use client"

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
} from "@/components/platform/listings/announcements/actions"
import {
  announcementConfigSchema,
  type AnnouncementConfigFormValues,
} from "@/components/platform/listings/announcements/validation"

interface ConfigFormProps {
  initialConfig: AnnouncementConfigData
  templates: Array<{ id: string; name: string; type: string }>
  dictionary?: Record<string, string>
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
        toast.success(dictionary?.saved || "Settings saved successfully")
      } else {
        toast.error(
          result.error || dictionary?.saveFailed || "Failed to save settings"
        )
      }
    })
  }

  // Dictionary with fallbacks
  const d = {
    publishingDefaults: dictionary?.publishingDefaults || "Publishing Defaults",
    notifications: dictionary?.notifications || "Notifications",
    templates: dictionary?.templates || "Templates",
    trackingRetention: dictionary?.trackingRetention || "Tracking & Retention",
    defaultScope: dictionary?.defaultScope || "Default Scope",
    defaultPriority: dictionary?.defaultPriority || "Default Priority",
    autoPublish: dictionary?.autoPublish || "Auto-publish",
    autoPublishDesc:
      dictionary?.autoPublishDesc || "Automatically publish new announcements",
    defaultExpiryDays: dictionary?.defaultExpiryDays || "Default Expiry (days)",
    emailOnPublish: dictionary?.emailOnPublish || "Email on Publish",
    emailOnPublishDesc:
      dictionary?.emailOnPublishDesc ||
      "Send email notifications when published",
    pushNotifications: dictionary?.pushNotifications || "Push Notifications",
    pushNotificationsDesc:
      dictionary?.pushNotificationsDesc ||
      "Send push notifications (coming soon)",
    quietHoursStart: dictionary?.quietHoursStart || "Quiet Hours Start",
    quietHoursEnd: dictionary?.quietHoursEnd || "Quiet Hours End",
    digestFrequency: dictionary?.digestFrequency || "Digest Frequency",
    defaultTemplate: dictionary?.defaultTemplate || "Default Template",
    allowCustomTemplates:
      dictionary?.allowCustomTemplates || "Allow Custom Templates",
    allowCustomTemplatesDesc:
      dictionary?.allowCustomTemplatesDesc ||
      "Let users create custom announcement templates",
    readTracking: dictionary?.readTracking || "Read Tracking",
    readTrackingDesc:
      dictionary?.readTrackingDesc || "Track when users read announcements",
    retentionDays: dictionary?.retentionDays || "Retention Period (days)",
    autoArchive: dictionary?.autoArchive || "Auto-archive",
    autoArchiveDesc:
      dictionary?.autoArchiveDesc ||
      "Automatically archive expired announcements",
    archiveAfterDays: dictionary?.archiveAfterDays || "Archive After (days)",
    saveChanges: dictionary?.saveChanges || "Save Changes",
    saving: dictionary?.saving || "Saving...",
    comingSoon: dictionary?.comingSoon || "Coming Soon",
    school: dictionary?.school || "School",
    class: dictionary?.class || "Class",
    role: dictionary?.role || "Role",
    low: dictionary?.low || "Low",
    normal: dictionary?.normal || "Normal",
    high: dictionary?.high || "High",
    urgent: dictionary?.urgent || "Urgent",
    none: dictionary?.none || "None",
    daily: dictionary?.daily || "Daily",
    weekly: dictionary?.weekly || "Weekly",
    noTemplate: dictionary?.noTemplate || "No default template",
    templatesCount: dictionary?.templatesCount || "templates available",
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Save Button Header */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Icons.loader2 className="mr-2 h-4 w-4 animate-spin" />
                {d.saving}
              </>
            ) : (
              <>
                <Icons.save className="mr-2 h-4 w-4" />
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
