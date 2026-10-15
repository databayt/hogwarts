"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useId } from "react"
import { ChevronDown, CreditCard, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { fill } from "@/components/school-dashboard/school/format"

import { useBillingText } from "./use-billing-text"

const TAB_IDS = ["general", "payment", "invoices", "limits"] as const

interface CardInfo {
  id: string
  last4: string
  brand: string
  expiry: string
  primary?: boolean
}

interface BillingSettingsProps {
  activeTab: string
  onTabChange: (tab: string) => void

  emailNotifications: boolean
  onEmailNotificationsChange: (value: boolean) => void

  usageAlerts: boolean
  onUsageAlertsChange: (value: boolean) => void

  invoiceReminders: boolean
  onInvoiceRemindersChange: (value: boolean) => void

  cards: CardInfo[]
  onAddCard: () => void

  invoiceFormat: "PDF" | "HTML"
  onInvoiceFormatChange: (format: "PDF" | "HTML") => void
  onEditBillingAddress: () => void

  overageProtection: boolean
  onOverageProtectionChange: (value: boolean) => void

  usageLimitAlerts: boolean
  onUsageLimitAlertsChange: (value: boolean) => void
  className?: string
}

interface SettingItemProps {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function SettingItem({
  title,
  description,
  checked,
  onCheckedChange,
}: SettingItemProps) {
  const switchId = `switch-${useId()}`

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0 flex-1 space-y-0.5">
        <label
          htmlFor={switchId}
          className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {title}
        </label>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <Switch
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="shrink-0"
      />
    </div>
  )
}

interface TabNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const b = useBillingText()
  return (
    <div className="bg-muted text-muted-foreground inline-flex h-9 w-full items-center justify-center gap-1 rounded-lg p-1">
      {TAB_IDS.map((id) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`ring-offset-background focus-visible:ring-ring inline-flex flex-1 items-center justify-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 sm:px-3 sm:text-sm ${
            activeTab === id
              ? "bg-background text-foreground shadow"
              : "hover:bg-background/50 hover:text-foreground"
          }`}
        >
          {b.settings.tabs[id]}
        </button>
      ))}
    </div>
  )
}

export function BillingSettings({
  activeTab,
  onTabChange,
  emailNotifications,
  onEmailNotificationsChange,
  usageAlerts,
  onUsageAlertsChange,
  invoiceReminders,
  onInvoiceRemindersChange,
  cards,
  onAddCard,
  invoiceFormat,
  onInvoiceFormatChange,
  onEditBillingAddress,
  overageProtection,
  onOverageProtectionChange,
  usageLimitAlerts,
  onUsageLimitAlertsChange,
  className,
}: BillingSettingsProps) {
  const b = useBillingText()
  const renderGeneralContent = () => (
    <div className="divide-border space-y-0 divide-y">
      <SettingItem
        title={b.settings.emailNotifications}
        description={b.settings.emailNotificationsHint}
        checked={emailNotifications}
        onCheckedChange={onEmailNotificationsChange}
      />
      <SettingItem
        title={b.settings.usageAlerts}
        description={b.settings.usageAlertsHint}
        checked={usageAlerts}
        onCheckedChange={onUsageAlertsChange}
      />
      <SettingItem
        title={b.settings.invoiceReminders}
        description={b.settings.invoiceRemindersHint}
        checked={invoiceReminders}
        onCheckedChange={onInvoiceRemindersChange}
      />
    </div>
  )

  const renderPaymentContent = () => (
    <div className="space-y-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className="flex flex-col justify-between gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:p-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <CreditCard className="text-muted-foreground h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm">•••• {card.last4}</span>
                {card.primary && (
                  <Badge variant="secondary">{b.settings.primary}</Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {card.brand} •{" "}
                {fill(b.settings.expires, { expiry: card.expiry })}
              </p>
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" className="w-full" onClick={onAddCard}>
        <Plus className="me-2 h-4 w-4" />
        {b.settings.addCard}
      </Button>
    </div>
  )

  const renderInvoicesContent = () => (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 space-y-0.5">
          <h3 className="text-sm font-medium">{b.settings.invoiceFormat}</h3>
          <p className="text-muted-foreground text-sm">
            {b.settings.invoiceFormatHint}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              {invoiceFormat}
              <ChevronDown className="ms-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onInvoiceFormatChange("PDF")}>
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onInvoiceFormatChange("HTML")}>
              HTML
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 space-y-0.5">
          <h3 className="text-sm font-medium">{b.settings.billingAddress}</h3>
          <p className="text-muted-foreground text-sm">
            {b.settings.billingAddressHint}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={onEditBillingAddress}
        >
          {b.settings.edit}
        </Button>
      </div>
    </div>
  )

  const renderLimitsContent = () => (
    <div className="divide-border space-y-0 divide-y">
      <SettingItem
        title={b.settings.overage}
        description={b.settings.overageHint}
        checked={overageProtection}
        onCheckedChange={onOverageProtectionChange}
      />
      <SettingItem
        title={b.settings.limitAlerts}
        description={b.settings.limitAlertsHint}
        checked={usageLimitAlerts}
        onCheckedChange={onUsageLimitAlertsChange}
      />
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return renderGeneralContent()
      case "payment":
        return renderPaymentContent()
      case "invoices":
        return renderInvoicesContent()
      case "limits":
        return renderLimitsContent()
      default:
        return renderGeneralContent()
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle>{b.settings.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 px-4 sm:px-6">
          <TabNavigation activeTab={activeTab} onTabChange={onTabChange} />
          {renderTabContent()}
        </CardContent>
      </Card>
    </div>
  )
}
