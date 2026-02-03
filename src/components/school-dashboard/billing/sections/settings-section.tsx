"use client"

import { useState } from "react"

import type { PaymentCard } from "@/lib/billingsdk-config"
import { BillingSettings } from "@/components/billingsdk/billing-settings"
import { BillingSettings2 } from "@/components/billingsdk/billing-settings-2"

interface SettingsSectionProps {
  // Billing Settings Props
  cards: PaymentCard[]
  onAddCard: () => void
  onEditBillingAddress: () => void

  // Initial values
  initialSettings?: {
    emailNotifications?: boolean
    usageAlerts?: boolean
    invoiceReminders?: boolean
    invoiceFormat?: "PDF" | "HTML"
    overageProtection?: boolean
    usageLimitAlerts?: boolean
    autoRenewal?: boolean
    invoiceEmails?: boolean
    promotionalEmails?: boolean
    billingEmail?: string
    fullName?: string
    taxId?: string
    currency?: string
  }

  // Callbacks
  onSettingsChange?: (settings: Record<string, unknown>) => void
  onSaveSettings?: () => void
}

export function SettingsSection({
  cards,
  onAddCard,
  onEditBillingAddress,
  initialSettings = {},
  onSettingsChange,
  onSaveSettings,
}: SettingsSectionProps) {
  const [activeTab, setActiveTab] = useState("general")
  const [settings, setSettings] = useState({
    emailNotifications: initialSettings.emailNotifications ?? true,
    usageAlerts: initialSettings.usageAlerts ?? true,
    invoiceReminders: initialSettings.invoiceReminders ?? true,
    invoiceFormat: initialSettings.invoiceFormat ?? ("PDF" as const),
    overageProtection: initialSettings.overageProtection ?? false,
    usageLimitAlerts: initialSettings.usageLimitAlerts ?? true,
    autoRenewal: initialSettings.autoRenewal ?? true,
    invoiceEmails: initialSettings.invoiceEmails ?? true,
    promotionalEmails: initialSettings.promotionalEmails ?? false,
    billingEmail: initialSettings.billingEmail ?? "",
    fullName: initialSettings.fullName ?? "",
    taxId: initialSettings.taxId ?? "",
    currency: initialSettings.currency ?? "USD",
  })

  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    onSettingsChange?.(newSettings)
  }

  // Transform cards to the format BillingSettings expects
  const cardInfos = cards.map((card) => ({
    id: card.id,
    last4: card.last4,
    brand: card.brand,
    expiry: card.expiry,
    primary: card.primary,
  }))

  return (
    <section className="space-y-6">
      <div>
        <h2>Billing Settings</h2>
        <p className="muted">
          Configure your billing preferences and notifications
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Primary Billing Settings (Tabbed) */}
        <BillingSettings
          activeTab={activeTab}
          onTabChange={setActiveTab}
          emailNotifications={settings.emailNotifications}
          onEmailNotificationsChange={(v) =>
            updateSetting("emailNotifications", v)
          }
          usageAlerts={settings.usageAlerts}
          onUsageAlertsChange={(v) => updateSetting("usageAlerts", v)}
          invoiceReminders={settings.invoiceReminders}
          onInvoiceRemindersChange={(v) => updateSetting("invoiceReminders", v)}
          cards={cardInfos}
          onAddCard={onAddCard}
          invoiceFormat={settings.invoiceFormat}
          onInvoiceFormatChange={(v) => updateSetting("invoiceFormat", v)}
          onEditBillingAddress={onEditBillingAddress}
          overageProtection={settings.overageProtection}
          onOverageProtectionChange={(v) =>
            updateSetting("overageProtection", v)
          }
          usageLimitAlerts={settings.usageLimitAlerts}
          onUsageLimitAlertsChange={(v) => updateSetting("usageLimitAlerts", v)}
        />

        {/* Extended Billing Settings (Form-based) */}
        <BillingSettings2
          title="Billing Information"
          features={[
            {
              id: "auto-renewal",
              label: "Auto-Renewal",
              description: "Automatically renew your subscription",
              enabled: settings.autoRenewal,
              onToggle: (v) => updateSetting("autoRenewal", v),
            },
            {
              id: "invoice-emails",
              label: "Invoice Emails",
              description: "Receive emails when invoices are generated",
              enabled: settings.invoiceEmails,
              onToggle: (v) => updateSetting("invoiceEmails", v),
            },
            {
              id: "promotional-emails",
              label: "Promotional Emails",
              description: "Receive occasional updates about new features",
              enabled: settings.promotionalEmails,
              onToggle: (v) => updateSetting("promotionalEmails", v),
            },
          ]}
          inputFields={[
            {
              id: "fullName",
              name: "fullName",
              value: settings.fullName,
              placeholder: "John Doe",
              onChange: (v) => updateSetting("fullName", v),
              label: "Full Name",
              type: "text",
              required: true,
            },
            {
              id: "billingEmail",
              name: "billingEmail",
              value: settings.billingEmail,
              placeholder: "billing@school.com",
              onChange: (v) => updateSetting("billingEmail", v),
              label: "Billing Email",
              helperText: "Invoices will be sent to this email",
              type: "email",
              required: true,
            },
            {
              id: "taxId",
              name: "taxId",
              value: settings.taxId,
              placeholder: "Tax ID (Optional)",
              onChange: (v) => updateSetting("taxId", v),
              label: "Tax ID",
              helperText: "For VAT or other tax purposes",
              type: "text",
            },
          ]}
          currencies={["USD", "EUR", "GBP", "SAR", "AED", "EGP"]}
          defaultCurrency={settings.currency}
          onCurrencyChange={(v) => updateSetting("currency", v)}
          onSave={onSaveSettings}
          onCancel={() => {
            // Reset to initial settings
            setSettings({
              emailNotifications: initialSettings.emailNotifications ?? true,
              usageAlerts: initialSettings.usageAlerts ?? true,
              invoiceReminders: initialSettings.invoiceReminders ?? true,
              invoiceFormat: initialSettings.invoiceFormat ?? "PDF",
              overageProtection: initialSettings.overageProtection ?? false,
              usageLimitAlerts: initialSettings.usageLimitAlerts ?? true,
              autoRenewal: initialSettings.autoRenewal ?? true,
              invoiceEmails: initialSettings.invoiceEmails ?? true,
              promotionalEmails: initialSettings.promotionalEmails ?? false,
              billingEmail: initialSettings.billingEmail ?? "",
              fullName: initialSettings.fullName ?? "",
              taxId: initialSettings.taxId ?? "",
              currency: initialSettings.currency ?? "USD",
            })
          }}
          saveButtonText="Save Changes"
          cancelButtonText="Reset"
        />
      </div>
    </section>
  )
}
