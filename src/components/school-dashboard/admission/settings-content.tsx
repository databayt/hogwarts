"use client"

import { useEffect, useState, useTransition } from "react"
import { Bell, Calculator, CreditCard, Save, Settings } from "lucide-react"
import { toast } from "sonner"

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
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getAdmissionSettings, saveAdmissionSettings } from "./settings/actions"

interface Props {
  dictionary: Dictionary["school"]
  lang: Locale
}

export default function SettingsContent({ dictionary, lang }: Props) {
  const t = dictionary.admission?.settings
  const isRTL = lang === "ar"
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)

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
  })

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const result = await getAdmissionSettings()
      if (result.success) {
        setSettings({
          allowMultipleApplications: result.data.allowMultipleApplications,
          requireDocuments: result.data.requireDocuments,
          applicationFee: result.data.applicationFee.toString(),
          offerExpiryDays: result.data.offerExpiryDays,
          autoEmailNotifications: result.data.autoEmailNotifications,
          enableOnlinePayment: result.data.enableOnlinePayment,
          academicWeight: result.data.academicWeight,
          entranceWeight: result.data.entranceWeight,
          interviewWeight: result.data.interviewWeight,
        })
      }
      setIsLoading(false)
    }
    loadSettings()
  }, [])

  const handleSave = () => {
    // Validate merit weights sum to 100
    const totalWeight =
      settings.academicWeight +
      settings.entranceWeight +
      settings.interviewWeight
    if (totalWeight !== 100) {
      toast.error(
        isRTL
          ? "يجب أن يكون مجموع أوزان الجدارة 100%"
          : "Merit weights must sum to 100%"
      )
      return
    }

    startTransition(async () => {
      const result = await saveAdmissionSettings({
        allowMultipleApplications: settings.allowMultipleApplications,
        requireDocuments: settings.requireDocuments,
        applicationFee: parseFloat(settings.applicationFee) || 0,
        offerExpiryDays: settings.offerExpiryDays,
        autoEmailNotifications: settings.autoEmailNotifications,
        enableOnlinePayment: settings.enableOnlinePayment,
        academicWeight: settings.academicWeight,
        entranceWeight: settings.entranceWeight,
        interviewWeight: settings.interviewWeight,
      })

      if (result.success) {
        toast.success(
          isRTL ? "تم حفظ الإعدادات بنجاح" : "Settings saved successfully"
        )
      } else {
        toast.error(result.error)
      }
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

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
            {t?.generalSettingsDescription ||
              "Configure general admission settings"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>
                {t?.allowMultipleApplications || "Allow Multiple Applications"}
              </Label>
              <p className="text-muted-foreground text-sm">
                {t?.allowMultipleApplicationsDesc ||
                  "Allow students to apply to multiple campaigns"}
              </p>
            </div>
            <Switch
              checked={settings.allowMultipleApplications}
              onCheckedChange={(checked) =>
                setSettings((s) => ({
                  ...s,
                  allowMultipleApplications: checked,
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t?.requireDocuments || "Require Document Upload"}</Label>
              <p className="text-muted-foreground text-sm">
                {t?.requireDocumentsDesc ||
                  "Require applicants to upload supporting documents"}
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
            {t?.notificationSettingsDescription ||
              "Configure email and notification preferences"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>
                {t?.autoEmailNotifications || "Automatic Email Notifications"}
              </Label>
              <p className="text-muted-foreground text-sm">
                {t?.autoEmailNotificationsDesc ||
                  "Send automatic status update emails to applicants"}
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
            {t?.paymentSettingsDescription ||
              "Configure payment and fee collection options"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t?.enableOnlinePayment || "Enable Online Payment"}</Label>
              <p className="text-muted-foreground text-sm">
                {t?.enableOnlinePaymentDesc ||
                  "Allow applicants to pay fees online"}
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
            {t?.meritCriteriaDescription ||
              "Set default weights for merit calculation"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{t?.academicWeight || "Academic Weight"}</Label>
                <span className="text-muted-foreground text-sm">
                  {settings.academicWeight}%
                </span>
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
                <span className="text-muted-foreground text-sm">
                  {settings.entranceWeight}%
                </span>
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
                <span className="text-muted-foreground text-sm">
                  {settings.interviewWeight}%
                </span>
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

            <div className="text-muted-foreground text-sm">
              Total:{" "}
              {settings.academicWeight +
                settings.entranceWeight +
                settings.interviewWeight}
              %
              {settings.academicWeight +
                settings.entranceWeight +
                settings.interviewWeight !==
                100 && (
                <span className="text-destructive ms-2">
                  (should equal 100%)
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending} className="gap-2">
          {isPending ? (
            <>
              <Save className="h-4 w-4 animate-spin" />
              {isRTL ? "جاري الحفظ..." : "Saving..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {t?.saveSettings || "Save Settings"}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
