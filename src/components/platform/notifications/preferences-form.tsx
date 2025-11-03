"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Bell, Mail, Smartphone, MessageSquare, Clock } from "lucide-react"
import { NOTIFICATION_TYPE_CONFIG } from "./config"
import { updateNotificationPreferences } from "./actions"
import type { NotificationChannel, NotificationType } from "@prisma/client"
import { Badge } from "@/components/ui/badge"

const preferencesFormSchema = z.object({
  preferences: z.array(
    z.object({
      type: z.string(),
      inApp: z.boolean(),
      email: z.boolean(),
      push: z.boolean(),
      sms: z.boolean(),
    })
  ),
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.number().min(0).max(23),
  quietHoursEnd: z.number().min(0).max(23),
  digestEnabled: z.boolean(),
  digestFrequency: z.enum(["daily", "weekly"]),
})

type PreferencesFormValues = z.infer<typeof preferencesFormSchema>

interface NotificationPreferencesFormProps {
  initialPreferences?: Array<{
    type: NotificationType
    channel: NotificationChannel
    enabled: boolean
    quietHoursStart?: number | null
    quietHoursEnd?: number | null
    digestEnabled?: boolean
    digestFrequency?: "daily" | "weekly" | null
  }>
}

export function NotificationPreferencesForm({
  initialPreferences = [],
}: NotificationPreferencesFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Transform initial preferences into form format
  const notificationTypes = Object.keys(NOTIFICATION_TYPE_CONFIG) as NotificationType[]

  const initialFormData: PreferencesFormValues = {
    preferences: notificationTypes.map((type) => {
      const inAppPref = initialPreferences.find(
        (p) => p.type === type && p.channel === "in_app"
      )
      const emailPref = initialPreferences.find(
        (p) => p.type === type && p.channel === "email"
      )
      const pushPref = initialPreferences.find(
        (p) => p.type === type && p.channel === "push"
      )
      const smsPref = initialPreferences.find(
        (p) => p.type === type && p.channel === "sms"
      )

      return {
        type,
        inApp: inAppPref?.enabled ?? true,
        email: emailPref?.enabled ?? false,
        push: pushPref?.enabled ?? false,
        sms: smsPref?.enabled ?? false,
      }
    }),
    quietHoursEnabled: initialPreferences.some((p) => p.quietHoursStart !== null),
    quietHoursStart: initialPreferences.find((p) => p.quietHoursStart !== null)?.quietHoursStart ?? 22,
    quietHoursEnd: initialPreferences.find((p) => p.quietHoursEnd !== null)?.quietHoursEnd ?? 8,
    digestEnabled: initialPreferences.some((p) => p.digestEnabled === true),
    digestFrequency: initialPreferences.find((p) => p.digestFrequency)?.digestFrequency ?? "daily",
  }

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: initialFormData,
  })

  const onSubmit = async (data: PreferencesFormValues) => {
    setIsLoading(true)

    try {
      // Transform form data into preference updates
      const updates = data.preferences.flatMap((pref) => {
        const channels: Array<{ channel: NotificationChannel; enabled: boolean }> = [
          { channel: "in_app", enabled: pref.inApp },
          { channel: "email", enabled: pref.email },
          { channel: "push", enabled: pref.push },
          { channel: "sms", enabled: pref.sms },
        ]

        return channels.map((ch) => ({
          type: pref.type as NotificationType,
          channel: ch.channel,
          enabled: ch.enabled,
          quietHoursStart: data.quietHoursEnabled ? data.quietHoursStart : undefined,
          quietHoursEnd: data.quietHoursEnabled ? data.quietHoursEnd : undefined,
          digestEnabled: data.digestEnabled,
          digestFrequency: data.digestEnabled ? data.digestFrequency : undefined,
        }))
      })

      const result = await updateNotificationPreferences(updates)

      if (result.success) {
        toast({
          title: "Preferences saved",
          description: "Your notification preferences have been updated successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const channelIcons = {
    inApp: Bell,
    email: Mail,
    push: Smartphone,
    sms: MessageSquare,
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>Quiet Hours</CardTitle>
            </div>
            <CardDescription>
              Pause notifications during specific hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="quietHoursEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>Enable Quiet Hours</FormLabel>
                    <FormDescription>
                      Don't send notifications during quiet hours
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

            {form.watch("quietHoursEnabled") && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="quietHoursStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {i.toString().padStart(2, "0")}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quietHoursEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {i.toString().padStart(2, "0")}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Digest Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Notification Digest</CardTitle>
            </div>
            <CardDescription>
              Receive a summary of notifications instead of individual alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="digestEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>Enable Digest</FormLabel>
                    <FormDescription>
                      Get a summary email instead of individual notifications
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

            {form.watch("digestEnabled") && (
              <FormField
                control={form.control}
                name="digestFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How often should we send digest emails?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Notification Type Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription>
              Choose which notifications you want to receive and how
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {form.watch("preferences").map((pref, index) => {
                const config = NOTIFICATION_TYPE_CONFIG[pref.type as NotificationType]
                const Icon = config.icon

                return (
                  <div key={pref.type} className="space-y-3">
                    {index > 0 && <Separator />}

                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-sm font-medium">
                            {pref.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </h4>
                          {config.requiresAction && (
                            <Badge variant="outline" className="text-xs">
                              Action Required
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {(["inApp", "email", "push", "sms"] as const).map((channel) => {
                            const ChannelIcon = channelIcons[channel]
                            return (
                              <FormField
                                key={channel}
                                control={form.control}
                                name={`preferences.${index}.${channel}`}
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormLabel className="flex items-center gap-1 text-xs font-normal cursor-pointer">
                                      <ChannelIcon className="h-3.5 w-3.5" />
                                      {channel === "inApp" ? "In-App" : channel.charAt(0).toUpperCase() + channel.slice(1)}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isLoading}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </div>
      </form>
    </Form>
  )
}
