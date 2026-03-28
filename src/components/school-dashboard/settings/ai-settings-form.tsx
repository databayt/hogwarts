"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { Bot, DollarSign, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
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
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { AIBudgetIndicator } from "@/components/school-dashboard/shared/ai-budget-indicator"

import {
  AI_DOMAINS,
  updateAISettings,
  type AIDomain,
} from "./ai-settings-actions"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UsageSummary {
  totalSpend: number
  monthlyLimit: number | null
  remaining: number | null
  percentUsed: number
  breakdown: Array<{ jobType: string; totalCost: number; count: number }>
}

interface AISettingsFormProps {
  dictionary: Record<string, any>
  currentBudget: number | null
  enabledDomains: string[]
  usageSummary: UsageSummary
}

// ---------------------------------------------------------------------------
// Domain metadata (labels resolved from dictionary with fallbacks)
// ---------------------------------------------------------------------------

interface DomainMeta {
  id: AIDomain
  fallbackLabel: string
  fallbackDescription: string
}

const DOMAIN_META: DomainMeta[] = [
  {
    id: "admission",
    fallbackLabel: "Admission",
    fallbackDescription: "Document processing for student applications",
  },
  {
    id: "finance",
    fallbackLabel: "Finance",
    fallbackDescription: "Receipt and invoice extraction",
  },
  {
    id: "exams",
    fallbackLabel: "Exams",
    fallbackDescription: "AI-powered exam generation",
  },
  {
    id: "attendance",
    fallbackLabel: "Attendance",
    fallbackDescription: "Attendance prediction models",
  },
  {
    id: "library",
    fallbackLabel: "Library",
    fallbackDescription: "Book metadata extraction",
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AISettingsForm = React.memo(function AISettingsForm({
  dictionary,
  currentBudget,
  enabledDomains,
  usageSummary,
}: AISettingsFormProps) {
  const d = dictionary?.settings?.ai ?? {}
  const common = dictionary?.settings?.userManagementLabels ?? {}

  // ---- State ----
  const [budgetEnabled, setBudgetEnabled] = React.useState(
    currentBudget !== null
  )
  const [budgetValue, setBudgetValue] = React.useState(
    currentBudget !== null ? String(currentBudget) : ""
  )
  const [domains, setDomains] = React.useState<Set<string>>(
    () => new Set(enabledDomains)
  )
  const [submitting, setSubmitting] = React.useState(false)

  // ---- Handlers ----
  const toggleDomain = React.useCallback((domain: string) => {
    setDomains((prev) => {
      const next = new Set(prev)
      if (next.has(domain)) {
        next.delete(domain)
      } else {
        next.add(domain)
      }
      return next
    })
  }, [])

  const handleBudgetToggle = React.useCallback(
    (checked: boolean) => {
      setBudgetEnabled(checked)
      if (!checked) {
        setBudgetValue("")
      } else if (currentBudget !== null) {
        setBudgetValue(String(currentBudget))
      }
    },
    [currentBudget]
  )

  const handleSubmit = React.useCallback(async () => {
    setSubmitting(true)
    try {
      const budget =
        budgetEnabled && budgetValue.trim() ? Number(budgetValue) : null

      if (budget !== null && (isNaN(budget) || budget < 0)) {
        ErrorToast(d.invalidBudget || "Please enter a valid budget amount")
        return
      }

      const result = await updateAISettings({
        budget,
        domains: Array.from(domains) as AIDomain[],
      })

      if (result.success) {
        SuccessToast(d.saved || "AI settings saved")
      } else {
        ErrorToast(d.saveFailed || "Failed to save AI settings")
      }
    } catch {
      ErrorToast(d.saveFailed || "Failed to save AI settings")
    } finally {
      setSubmitting(false)
    }
  }, [budgetEnabled, budgetValue, domains, d])

  // ---- Derived ----
  const domainLabels = React.useMemo(() => {
    const labels: Record<string, { label: string; description: string }> = {}
    for (const meta of DOMAIN_META) {
      labels[meta.id] = {
        label: d?.domains?.[meta.id]?.label || meta.fallbackLabel,
        description:
          d?.domains?.[meta.id]?.description || meta.fallbackDescription,
      }
    }
    return labels
  }, [d])

  return (
    <div className="space-y-6">
      {/* ---- Budget & Usage Card ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" aria-hidden="true" />
            {d.budgetTitle || "AI Budget"}
          </CardTitle>
          <CardDescription>
            {d.budgetDescription ||
              "Set a monthly spending limit for AI services"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current usage indicator */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {d.currentUsage || "Current Month Usage"}
            </Label>
            <AIBudgetIndicator
              spent={usageSummary.totalSpend}
              limit={usageSummary.monthlyLimit}
              dictionary={dictionary}
            />
          </div>

          <Separator />

          {/* Budget toggle + input */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="budget-toggle" className="text-sm font-medium">
                  {d.enableBudgetLimit || "Enable Budget Limit"}
                </Label>
                <p className="text-muted-foreground text-xs">
                  {d.enableBudgetHint || "When disabled, AI usage is unlimited"}
                </p>
              </div>
              <Switch
                id="budget-toggle"
                checked={budgetEnabled}
                onCheckedChange={handleBudgetToggle}
              />
            </div>

            {budgetEnabled && (
              <div className="space-y-2">
                <Label htmlFor="monthly-budget" className="text-sm font-medium">
                  {d.monthlyBudget || "Monthly Budget (USD)"}
                </Label>
                <div className="relative max-w-xs">
                  <span className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-sm">
                    $
                  </span>
                  <Input
                    id="monthly-budget"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="50.00"
                    value={budgetValue}
                    onChange={(e) => setBudgetValue(e.target.value)}
                    className="ps-7"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Per-domain breakdown table */}
          {usageSummary.breakdown.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {d.costBreakdown || "Cost Breakdown"}
                </Label>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="px-4 py-2 text-start font-medium">
                          {d.domain || "Domain"}
                        </th>
                        <th className="px-4 py-2 text-start font-medium">
                          {d.requests || "Requests"}
                        </th>
                        <th className="px-4 py-2 text-end font-medium">
                          {d.cost || "Cost"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageSummary.breakdown.map((row) => (
                        <tr
                          key={row.jobType}
                          className="border-b last:border-0"
                        >
                          <td className="px-4 py-2">
                            {domainLabels[row.jobType]?.label || row.jobType}
                          </td>
                          <td className="px-4 py-2">{row.count}</td>
                          <td className="px-4 py-2 text-end font-mono">
                            ${row.totalCost.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ---- Domain Toggles Card ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" aria-hidden="true" />
            {d.domainsTitle || "AI Domains"}
          </CardTitle>
          <CardDescription>
            {d.domainsDescription ||
              "Choose which school modules can use AI features"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {AI_DOMAINS.map((domain) => {
            const meta = domainLabels[domain]
            const isEnabled = domains.has(domain)
            return (
              <div
                key={domain}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-4 transition-colors",
                  isEnabled ? "bg-primary/5 border-primary/20" : "bg-muted/30"
                )}
              >
                <div className="space-y-0.5">
                  <Label
                    htmlFor={`domain-${domain}`}
                    className="text-sm font-medium"
                  >
                    {meta?.label}
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    {meta?.description}
                  </p>
                </div>
                <Switch
                  id={`domain-${domain}`}
                  checked={isEnabled}
                  onCheckedChange={() => toggleDomain(domain)}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* ---- Save Button ---- */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting && (
            <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {submitting
            ? common.saving || "Saving..."
            : common.saveSettings || "Save Settings"}
        </Button>
      </div>
    </div>
  )
})

export type { AISettingsFormProps }
