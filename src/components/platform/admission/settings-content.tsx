"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Save, Settings, Bell, CreditCard, Calculator } from "lucide-react";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  dictionary: Dictionary["school"];
  lang: Locale;
}

export default function SettingsContent({ dictionary, lang }: Props) {
  const t = dictionary.admission?.settings;

  // Settings state
  const [settings, setSettings] = useState({
    allowMultipleApplications: false,
    requireDocuments: true,
    applicationFee: "0",
    offerExpiryDays: 14,
    autoEmailNotifications: true,
    enableOnlinePayment: false,
    academicWeight: 40,
    entranceWeight: 35,
    interviewWeight: 25,
  });

  const handleSave = () => {
    // Save settings action would go here
    console.log("Saving settings:", settings);
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t?.generalSettings || "General Settings"}
          </CardTitle>
          <CardDescription>
            {t?.generalSettingsDescription || "Configure general admission settings"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t?.allowMultipleApplications || "Allow Multiple Applications"}</Label>
              <p className="text-sm text-muted-foreground">
                {t?.allowMultipleApplicationsDesc || "Allow students to apply to multiple campaigns"}
              </p>
            </div>
            <Switch
              checked={settings.allowMultipleApplications}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, allowMultipleApplications: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t?.requireDocuments || "Require Document Upload"}</Label>
              <p className="text-sm text-muted-foreground">
                {t?.requireDocumentsDesc || "Require applicants to upload supporting documents"}
              </p>
            </div>
            <Switch
              checked={settings.requireDocuments}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, requireDocuments: checked }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="applicationFee">
                {t?.applicationFee || "Application Fee"}
              </Label>
              <Input
                id="applicationFee"
                type="number"
                value={settings.applicationFee}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, applicationFee: e.target.value }))
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offerExpiryDays">
                {t?.offerExpiryDays || "Offer Expiry (days)"}
              </Label>
              <Input
                id="offerExpiryDays"
                type="number"
                value={settings.offerExpiryDays}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    offerExpiryDays: parseInt(e.target.value) || 14,
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t?.notificationSettings || "Notification Settings"}
          </CardTitle>
          <CardDescription>
            {t?.notificationSettingsDescription || "Configure email and notification preferences"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t?.autoEmailNotifications || "Automatic Email Notifications"}</Label>
              <p className="text-sm text-muted-foreground">
                {t?.autoEmailNotificationsDesc || "Send automatic status update emails to applicants"}
              </p>
            </div>
            <Switch
              checked={settings.autoEmailNotifications}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, autoEmailNotifications: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t?.paymentSettings || "Payment Settings"}
          </CardTitle>
          <CardDescription>
            {t?.paymentSettingsDescription || "Configure payment and fee collection options"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t?.enableOnlinePayment || "Enable Online Payment"}</Label>
              <p className="text-sm text-muted-foreground">
                {t?.enableOnlinePaymentDesc || "Allow applicants to pay fees online"}
              </p>
            </div>
            <Switch
              checked={settings.enableOnlinePayment}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, enableOnlinePayment: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Merit Criteria Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t?.meritCriteria || "Default Merit Criteria"}
          </CardTitle>
          <CardDescription>
            {t?.meritCriteriaDescription || "Set default weights for merit calculation"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{t?.academicWeight || "Academic Weight"}</Label>
                <span className="text-sm text-muted-foreground">{settings.academicWeight}%</span>
              </div>
              <Slider
                value={[settings.academicWeight]}
                onValueChange={([value]) =>
                  setSettings((s) => ({ ...s, academicWeight: value }))
                }
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{t?.entranceWeight || "Entrance Exam Weight"}</Label>
                <span className="text-sm text-muted-foreground">{settings.entranceWeight}%</span>
              </div>
              <Slider
                value={[settings.entranceWeight]}
                onValueChange={([value]) =>
                  setSettings((s) => ({ ...s, entranceWeight: value }))
                }
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{t?.interviewWeight || "Interview Weight"}</Label>
                <span className="text-sm text-muted-foreground">{settings.interviewWeight}%</span>
              </div>
              <Slider
                value={[settings.interviewWeight]}
                onValueChange={([value]) =>
                  setSettings((s) => ({ ...s, interviewWeight: value }))
                }
                max={100}
                step={5}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              Total: {settings.academicWeight + settings.entranceWeight + settings.interviewWeight}%
              {settings.academicWeight + settings.entranceWeight + settings.interviewWeight !== 100 && (
                <span className="text-destructive ml-2">(should equal 100%)</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          {t?.saveSettings || "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
