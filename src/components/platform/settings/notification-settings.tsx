"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Volume2,
  VolumeX,
  Clock,
  Calendar,
  TriangleAlert,
  Info,
  CircleCheck,
} from "lucide-react";
import { SuccessToast } from "@/components/atom/toast";
import { type Dictionary } from "@/components/internationalization/dictionaries";

interface NotificationSettings {
  email: {
    enabled: boolean;
    digest: "instant" | "daily" | "weekly";
    types: {
      announcements: boolean;
      assignments: boolean;
      grades: boolean;
      attendance: boolean;
      fees: boolean;
      emergencies: boolean;
    };
  };
  push: {
    enabled: boolean;
    sound: boolean;
    types: {
      announcements: boolean;
      assignments: boolean;
      grades: boolean;
      attendance: boolean;
      fees: boolean;
      emergencies: boolean;
    };
  };
  sms: {
    enabled: boolean;
    types: {
      emergencies: boolean;
      attendance: boolean;
      fees: boolean;
    };
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    allowEmergencies: boolean;
  };
}

interface Props {
  dictionary?: Dictionary["school"];
}

export function NotificationSettings({ dictionary }: Props) {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      enabled: true,
      digest: "instant",
      types: {
        announcements: true,
        assignments: true,
        grades: true,
        attendance: true,
        fees: true,
        emergencies: true,
      },
    },
    push: {
      enabled: true,
      sound: true,
      types: {
        announcements: true,
        assignments: false,
        grades: true,
        attendance: true,
        fees: false,
        emergencies: true,
      },
    },
    sms: {
      enabled: false,
      types: {
        emergencies: true,
        attendance: false,
        fees: false,
      },
    },
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "07:00",
      allowEmergencies: true,
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In production, save to database
      await new Promise((resolve) => setTimeout(resolve, 1000));
      localStorage.setItem("notification-settings", JSON.stringify(settings));
      SuccessToast("Notification settings saved");
    } finally {
      setIsSaving(false);
    }
  };

  const updateEmailType = (type: keyof typeof settings.email.types, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      email: {
        ...prev.email,
        types: {
          ...prev.email.types,
          [type]: value,
        },
      },
    }));
  };

  const updatePushType = (type: keyof typeof settings.push.types, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      push: {
        ...prev.push,
        types: {
          ...prev.push.types,
          [type]: value,
        },
      },
    }));
  };

  const updateSmsType = (type: keyof typeof settings.sms.types, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      sms: {
        ...prev.sms,
        types: {
          ...prev.sms.types,
          [type]: value,
        },
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl:flex-row-reverse">
            <Mail className="h-5 w-5" />
            {dictionary?.settings?.notificationSettings?.emailNotifications || "Email Notifications"}
          </CardTitle>
          <CardDescription>
            {dictionary?.settings?.notificationSettings?.configureEmail || "Configure email notification preferences"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rtl:flex-row-reverse">
            <Label htmlFor="email-enabled">{dictionary?.settings?.notificationSettings?.enableEmail || "Enable Email Notifications"}</Label>
            <Switch
              id="email-enabled"
              checked={settings.email.enabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({
                  ...prev,
                  email: { ...prev.email, enabled: checked },
                }))
              }
            />
          </div>

          {settings.email.enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email-digest">{dictionary?.settings?.notificationSettings?.emailFrequency || "Email Frequency"}</Label>
                <Select
                  value={settings.email.digest}
                  onValueChange={(value: "instant" | "daily" | "weekly") =>
                    setSettings((prev) => ({
                      ...prev,
                      email: { ...prev.email, digest: value },
                    }))
                  }
                >
                  <SelectTrigger id="email-digest">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">{dictionary?.settings?.notificationSettings?.instant || "Instant"}</SelectItem>
                    <SelectItem value="daily">{dictionary?.settings?.notificationSettings?.dailyDigest || "Daily Digest"}</SelectItem>
                    <SelectItem value="weekly">{dictionary?.settings?.notificationSettings?.weeklyDigest || "Weekly Digest"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>{dictionary?.settings?.notificationSettings?.notificationTypes || "Notification Types"}</Label>
                <div className="space-y-2">
                  {Object.entries(settings.email.types).map(([type, enabled]) => (
                    <div key={type} className="flex items-center justify-between py-1 rtl:flex-row-reverse">
                      <Label
                        htmlFor={`email-${type}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {dictionary?.settings?.notificationSettings?.types?.[type as keyof typeof dictionary.settings.notificationSettings.types] || type}
                      </Label>
                      <Switch
                        id={`email-${type}`}
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          updateEmailType(type as keyof typeof settings.email.types, checked)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl:flex-row-reverse">
            <Bell className="h-5 w-5" />
            {dictionary?.settings?.notificationSettings?.pushNotifications || "Push Notifications"}
          </CardTitle>
          <CardDescription>
            {dictionary?.settings?.notificationSettings?.configurePush || "Configure browser push notification preferences"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rtl:flex-row-reverse">
            <Label htmlFor="push-enabled">{dictionary?.settings?.notificationSettings?.enablePush || "Enable Push Notifications"}</Label>
            <Switch
              id="push-enabled"
              checked={settings.push.enabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({
                  ...prev,
                  push: { ...prev.push, enabled: checked },
                }))
              }
            />
          </div>

          {settings.push.enabled && (
            <>
              <div className="flex items-center justify-between rtl:flex-row-reverse">
                <Label htmlFor="push-sound" className="flex items-center gap-2 rtl:flex-row-reverse">
                  {settings.push.sound ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                  {dictionary?.settings?.notificationSettings?.notificationSound || "Notification Sound"}
                </Label>
                <Switch
                  id="push-sound"
                  checked={settings.push.sound}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      push: { ...prev.push, sound: checked },
                    }))
                  }
                />
              </div>

              <div className="space-y-3">
                <Label>{dictionary?.settings?.notificationSettings?.notificationTypes || "Notification Types"}</Label>
                <div className="space-y-2">
                  {Object.entries(settings.push.types).map(([type, enabled]) => (
                    <div key={type} className="flex items-center justify-between py-1 rtl:flex-row-reverse">
                      <Label
                        htmlFor={`push-${type}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {dictionary?.settings?.notificationSettings?.types?.[type as keyof typeof dictionary.settings.notificationSettings.types] || type}
                      </Label>
                      <Switch
                        id={`push-${type}`}
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          updatePushType(type as keyof typeof settings.push.types, checked)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl:flex-row-reverse">
            <Smartphone className="h-5 w-5" />
            {dictionary?.settings?.notificationSettings?.smsNotifications || "SMS Notifications"}
          </CardTitle>
          <CardDescription>
            {dictionary?.settings?.notificationSettings?.configureSms || "Configure SMS notification preferences for critical alerts"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rtl:flex-row-reverse">
            <div className="space-y-1">
              <Label htmlFor="sms-enabled">{dictionary?.settings?.notificationSettings?.enableSms || "Enable SMS Notifications"}</Label>
              <p className="text-xs text-muted-foreground">
                {dictionary?.settings?.notificationSettings?.smsCharges || "SMS notifications may incur additional charges"}
              </p>
            </div>
            <Switch
              id="sms-enabled"
              checked={settings.sms.enabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({
                  ...prev,
                  sms: { ...prev.sms, enabled: checked },
                }))
              }
            />
          </div>

          {settings.sms.enabled && (
            <div className="space-y-3">
              <Label>{dictionary?.settings?.notificationSettings?.notificationTypes || "SMS Notification Types"}</Label>
              <div className="space-y-2">
                {Object.entries(settings.sms.types).map(([type, enabled]) => (
                  <div key={type} className="flex items-center justify-between py-1 rtl:flex-row-reverse">
                    <div className="flex items-center gap-2 rtl:flex-row-reverse">
                      {type === "emergencies" && (
                        <TriangleAlert className="h-4 w-4 text-red-500" />
                      )}
                      <Label
                        htmlFor={`sms-${type}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {dictionary?.settings?.notificationSettings?.types?.[type as keyof typeof dictionary.settings.notificationSettings.types] || type}
                      </Label>
                    </div>
                    <Switch
                      id={`sms-${type}`}
                      checked={enabled}
                      onCheckedChange={(checked) =>
                        updateSmsType(type as keyof typeof settings.sms.types, checked)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl:flex-row-reverse">
            <Clock className="h-5 w-5" />
            {dictionary?.settings?.notificationSettings?.quietHours || "Quiet Hours"}
          </CardTitle>
          <CardDescription>
            {dictionary?.settings?.notificationSettings?.setQuietHours || "Set quiet hours to pause non-critical notifications"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rtl:flex-row-reverse">
            <Label htmlFor="quiet-enabled">{dictionary?.settings?.notificationSettings?.enableQuietHours || "Enable Quiet Hours"}</Label>
            <Switch
              id="quiet-enabled"
              checked={settings.quietHours.enabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({
                  ...prev,
                  quietHours: { ...prev.quietHours, enabled: checked },
                }))
              }
            />
          </div>

          {settings.quietHours.enabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quiet-start">{dictionary?.settings?.notificationSettings?.startTime || "Start Time"}</Label>
                  <input
                    id="quiet-start"
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, start: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet-end">{dictionary?.settings?.notificationSettings?.endTime || "End Time"}</Label>
                  <input
                    id="quiet-end"
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, end: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rtl:flex-row-reverse">
                <div className="space-y-1">
                  <Label htmlFor="allow-emergencies" className="flex items-center gap-2 rtl:flex-row-reverse">
                    <TriangleAlert className="h-4 w-4 text-red-500" />
                    {dictionary?.settings?.notificationSettings?.allowEmergencies || "Allow Emergency Notifications"}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {dictionary?.settings?.notificationSettings?.emergenciesNote || "Critical alerts will still be sent during quiet hours"}
                  </p>
                </div>
                <Switch
                  id="allow-emergencies"
                  checked={settings.quietHours.allowEmergencies}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, allowEmergencies: checked },
                    }))
                  }
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{dictionary?.settings?.notificationSettings?.notificationSummary || "Notification Summary"}</CardTitle>
          <CardDescription>
            {dictionary?.settings?.notificationSettings?.overviewPreferences || "Overview of your notification preferences"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-background rtl:flex-row-reverse">
              <div className="flex items-center gap-2 rtl:flex-row-reverse">
                <Mail className="h-4 w-4" />
                <span>{dictionary?.settings?.notificationSettings?.email || "Email"}</span>
              </div>
              <Badge variant={settings.email.enabled ? "default" : "secondary"}>
                {settings.email.enabled ? (dictionary?.settings?.notificationSettings?.enabled || "Enabled") : (dictionary?.settings?.notificationSettings?.disabled || "Disabled")}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-background rtl:flex-row-reverse">
              <div className="flex items-center gap-2 rtl:flex-row-reverse">
                <Bell className="h-4 w-4" />
                <span>{dictionary?.settings?.notificationSettings?.push || "Push"}</span>
              </div>
              <Badge variant={settings.push.enabled ? "default" : "secondary"}>
                {settings.push.enabled ? (dictionary?.settings?.notificationSettings?.enabled || "Enabled") : (dictionary?.settings?.notificationSettings?.disabled || "Disabled")}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-background rtl:flex-row-reverse">
              <div className="flex items-center gap-2 rtl:flex-row-reverse">
                <Smartphone className="h-4 w-4" />
                <span>{dictionary?.settings?.notificationSettings?.sms || "SMS"}</span>
              </div>
              <Badge variant={settings.sms.enabled ? "default" : "secondary"}>
                {settings.sms.enabled ? (dictionary?.settings?.notificationSettings?.enabled || "Enabled") : (dictionary?.settings?.notificationSettings?.disabled || "Disabled")}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-background rtl:flex-row-reverse">
              <div className="flex items-center gap-2 rtl:flex-row-reverse">
                <Clock className="h-4 w-4" />
                <span>{dictionary?.settings?.notificationSettings?.quietHours || "Quiet Hours"}</span>
              </div>
              <Badge variant={settings.quietHours.enabled ? "default" : "secondary"}>
                {settings.quietHours.enabled
                  ? `${settings.quietHours.start} - ${settings.quietHours.end}`
                  : (dictionary?.settings?.notificationSettings?.disabled || "Disabled")}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end rtl:justify-start">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (dictionary?.settings?.notificationSettings?.saving || "Saving...") : (dictionary?.settings?.notificationSettings?.saveSettings || "Save Notification Settings")}
        </Button>
      </div>
    </div>
  );
}