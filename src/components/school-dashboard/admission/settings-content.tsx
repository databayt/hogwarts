"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import { Bell, Calculator, CreditCard, Save, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getAdmissionSettings, saveAdmissionSettings } from "./settings/actions"

interface Props {
  dictionary: Dictionary["school"]
  lang: Locale
}

export default function SettingsContent({ dictionary, lang }: Props) {
  const t = dictionary.admission?.settings
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
    paymentMethods: ["stripe", "cash"] as string[],
    bankDetails: {
      bankName: "",
      accountName: "",
      accountNumber: "",
      iban: "",
      swiftCode: "",
    },
    cashPaymentInstructions: "",
    academicWeight: 40,
    entranceWeight: 35,
    interviewWeight: 25,
  })

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const result = await getAdmissionSettings()
      if (result.success && result.data) {
        const bd = result.data.bankDetails as Record<string, string> | null
        setSettings({
          allowMultipleApplications: result.data.allowMultipleApplications,
          requireDocuments: result.data.requireDocuments,
          applicationFee: result.data.applicationFee.toString(),
          offerExpiryDays: result.data.offerExpiryDays,
          autoEmailNotifications: result.data.autoEmailNotifications,
          enableOnlinePayment: result.data.enableOnlinePayment,
          paymentMethods: (result.data.paymentMethods as string[]) ?? [
            "stripe",
            "cash",
          ],
          bankDetails: {
            bankName: bd?.bankName ?? "",
            accountName: bd?.accountName ?? "",
            accountNumber: bd?.accountNumber ?? "",
            iban: bd?.iban ?? "",
            swiftCode: bd?.swiftCode ?? "",
          },
          cashPaymentInstructions:
            (result.data.cashPaymentInstructions as string) ?? "",
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
      ErrorToast(t?.weightsMustSum || "Merit weights must sum to 100%")
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
        paymentMethods: settings.paymentMethods as (
          | "stripe"
          | "cash"
          | "bank_transfer"
        )[],
        bankDetails: settings.paymentMethods.includes("bank_transfer")
          ? settings.bankDetails
          : null,
        cashPaymentInstructions: settings.paymentMethods.includes("cash")
          ? settings.cashPaymentInstructions || null
          : null,
        academicWeight: settings.academicWeight,
        entranceWeight: settings.entranceWeight,
        interviewWeight: settings.interviewWeight,
      })

      if (result.success) {
        SuccessToast(t?.settingsSaved || "Settings saved successfully")
      } else {
        ErrorToast(
          t?.settingsFailed || result.error || "Failed to save settings"
        )
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

          <Separator />

          {/* Payment Methods */}
          <div className="space-y-3">
            <Label>{t?.paymentMethods || "Payment Methods"}</Label>
            <p className="text-muted-foreground text-sm">
              {t?.paymentMethodsDesc ||
                "Select which payment methods applicants can use"}
            </p>
            <div className="flex flex-col gap-3">
              {(
                [
                  {
                    value: "stripe",
                    label: t?.methodStripe || "Credit/Debit Card (Stripe)",
                  },
                  { value: "cash", label: t?.methodCash || "Cash at School" },
                  {
                    value: "bank_transfer",
                    label: t?.methodBankTransfer || "Bank Transfer",
                  },
                ] as const
              ).map((method) => (
                <div key={method.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`method-${method.value}`}
                    checked={settings.paymentMethods.includes(method.value)}
                    onCheckedChange={(checked) => {
                      setSettings((s) => ({
                        ...s,
                        paymentMethods: checked
                          ? [...s.paymentMethods, method.value]
                          : s.paymentMethods.filter((m) => m !== method.value),
                      }))
                    }}
                  />
                  <Label
                    htmlFor={`method-${method.value}`}
                    className="font-normal"
                  >
                    {method.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Cash Instructions — shown when cash is selected */}
          {settings.paymentMethods.includes("cash") && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="cashInstructions">
                  {t?.cashInstructions || "Cash Payment Instructions"}
                </Label>
                <p className="text-muted-foreground text-sm">
                  {t?.cashInstructionsDesc ||
                    "Custom instructions shown to applicants choosing cash payment"}
                </p>
                <Textarea
                  id="cashInstructions"
                  value={settings.cashPaymentInstructions}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      cashPaymentInstructions: e.target.value,
                    }))
                  }
                  placeholder={
                    t?.cashInstructionsPlaceholder ||
                    "e.g. Visit the school office during working hours with your reference number"
                  }
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Bank Details — shown when bank_transfer is selected */}
          {settings.paymentMethods.includes("bank_transfer") && (
            <>
              <Separator />
              <div className="space-y-4">
                <div>
                  <Label>{t?.bankDetails || "Bank Account Details"}</Label>
                  <p className="text-muted-foreground text-sm">
                    {t?.bankDetailsDesc ||
                      "Bank details shown to applicants choosing bank transfer"}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">
                      {t?.bankName || "Bank Name"}
                    </Label>
                    <Input
                      id="bankName"
                      value={settings.bankDetails.bankName}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          bankDetails: {
                            ...s.bankDetails,
                            bankName: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountName">
                      {t?.accountName || "Account Name"}
                    </Label>
                    <Input
                      id="accountName"
                      value={settings.bankDetails.accountName}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          bankDetails: {
                            ...s.bankDetails,
                            accountName: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">
                      {t?.accountNumber || "Account Number"}
                    </Label>
                    <Input
                      id="accountNumber"
                      value={settings.bankDetails.accountNumber}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          bankDetails: {
                            ...s.bankDetails,
                            accountNumber: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      value={settings.bankDetails.iban}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          bankDetails: {
                            ...s.bankDetails,
                            iban: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="swiftCode">
                      {t?.swiftCode || "SWIFT Code"}
                    </Label>
                    <Input
                      id="swiftCode"
                      value={settings.bankDetails.swiftCode}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          bankDetails: {
                            ...s.bankDetails,
                            swiftCode: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </>
          )}
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
                  ({t?.shouldEqual100 || "should equal 100%"})
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
              {t?.saving || "Saving..."}
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
