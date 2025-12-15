"use client"

import { useState } from "react"

import { BillingSettings } from "@/components/billingsdk/billing-settings"

const demoCards = [
  {
    id: "card_1",
    last4: "4242",
    brand: "Visa",
    expiry: "12/25",
    primary: true,
  },
  {
    id: "card_2",
    last4: "5555",
    brand: "Mastercard",
    expiry: "08/26",
  },
]

export function BillingSettingsDemo() {
  const [activeTab, setActiveTab] = useState("general")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [usageAlerts, setUsageAlerts] = useState(true)
  const [invoiceReminders, setInvoiceReminders] = useState(false)
  const [invoiceFormat, setInvoiceFormat] = useState<"PDF" | "HTML">("PDF")
  const [overageProtection, setOverageProtection] = useState(true)
  const [usageLimitAlerts, setUsageLimitAlerts] = useState(true)

  return (
    <BillingSettings
      activeTab={activeTab}
      onTabChange={setActiveTab}
      emailNotifications={emailNotifications}
      onEmailNotificationsChange={setEmailNotifications}
      usageAlerts={usageAlerts}
      onUsageAlertsChange={setUsageAlerts}
      invoiceReminders={invoiceReminders}
      onInvoiceRemindersChange={setInvoiceReminders}
      cards={demoCards}
      onAddCard={() => console.log("Add card clicked")}
      invoiceFormat={invoiceFormat}
      onInvoiceFormatChange={setInvoiceFormat}
      onEditBillingAddress={() => console.log("Edit billing address clicked")}
      overageProtection={overageProtection}
      onOverageProtectionChange={setOverageProtection}
      usageLimitAlerts={usageLimitAlerts}
      onUsageLimitAlertsChange={setUsageLimitAlerts}
    />
  )
}
