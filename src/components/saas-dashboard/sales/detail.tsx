"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, Building2, Mail, Phone } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { confirmDeleteDialog } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  PRIORITY_COLORS,
  STATUS_COLORS,
  type LeadPriorityKey,
  type LeadStatusKey,
} from "@/components/sales/constants"

import {
  deleteOperatorLead,
  type OperatorLeadActivity,
  type OperatorLeadDetail,
} from "./actions"
import { LeadActivityLog } from "./activity-log"
import { OperatorLeadForm } from "./form"

interface Props {
  data: OperatorLeadDetail | null
  activities: OperatorLeadActivity[]
  error?: string | null
  dictionary?: Dictionary["sales"]
  lang: Locale
}

// Derive A/B/C from the convention enforced by prisma/seeds/sales-network.ts:
// tags include exactly one of "tier-a" | "tier-b" | "tier-c".
function deriveTier(tags: string[]): "A" | "B" | "C" | null {
  const found = tags.find((t) => /^tier-[abc]$/i.test(t))
  if (!found) return null
  return found.split("-")[1].toUpperCase() as "A" | "B" | "C"
}

function tierBadgeClass(tier: "A" | "B" | "C" | null): string {
  switch (tier) {
    case "A":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
    case "B":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
    case "C":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
    default:
      return ""
  }
}

export function LeadDetailContent({
  data,
  activities,
  error,
  dictionary,
  lang,
}: Props) {
  const router = useRouter()
  const isRTL = lang === "ar"

  const d = dictionary?.detail
  const t = {
    back: d?.back ?? "Back to leads",
    overview: d?.overview ?? "Overview",
    pipeline: d?.pipeline ?? "Pipeline",
    notFound: d?.notFound ?? "Lead not found",
    errorTitle: d?.errorTitle ?? "Could not load lead",
    deleted: d?.deleted ?? "Lead deleted",
    delete: dictionary?.delete ?? "Delete",
    lastUpdated: d?.lastUpdated ?? "Last updated",
    createdAt: d?.createdAt ?? "Created",
    deleteConfirm: dictionary?.deleteConfirm ?? "Delete {name}?",
    deleteFailed: dictionary?.deleteFailed ?? "Failed to delete lead",
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href={`/${lang}/sales`}>
            <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
            {t.back}
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t.errorTitle}</AlertTitle>
          <AlertDescription>{error ?? t.notFound}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const tier = deriveTier(data.tags)
  const statusLabel = dictionary?.status?.[data.status] ?? data.status
  const priorityLabel = dictionary?.priority?.[data.priority] ?? data.priority
  const countryLabel = data.country
    ? (dictionary?.country?.[
        data.country as keyof NonNullable<typeof dictionary.country>
      ] ?? data.country)
    : null

  const overdue =
    data.nextFollowUpAt && new Date(data.nextFollowUpAt) < new Date()

  const onDelete = async () => {
    const ok = await confirmDeleteDialog(
      t.deleteConfirm.replace("{name}", data.name)
    )
    if (!ok) return
    const res = await deleteOperatorLead(data.id)
    if (res.success) {
      toast.success(t.deleted)
      router.push(`/${lang}/sales`)
    } else {
      toast.error(res.error || t.deleteFailed)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top bar — back link + delete */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href={`/${lang}/sales`}>
            <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
            {t.back}
          </Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          {t.delete}
        </Button>
      </div>

      {/* Header — name, company, badges */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold">{data.name}</h1>
          {data.title && (
            <span className="text-muted-foreground">{data.title}</span>
          )}
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {data.company && (
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {data.company}
            </span>
          )}
          {data.email && (
            <a
              href={`mailto:${data.email}`}
              className="hover:text-foreground flex items-center gap-1.5"
            >
              <Mail className="h-4 w-4" />
              {data.email}
            </a>
          )}
          {data.phone && (
            <a
              href={`tel:${data.phone}`}
              className="hover:text-foreground flex items-center gap-1.5"
            >
              <Phone className="h-4 w-4" />
              {data.phone}
            </a>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={cn(
              "text-xs",
              STATUS_COLORS[data.status as LeadStatusKey]
            )}
          >
            {statusLabel}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              PRIORITY_COLORS[data.priority as LeadPriorityKey]
            )}
          >
            {priorityLabel}
          </Badge>
          {tier && (
            <Badge className={cn("text-xs", tierBadgeClass(tier))}>
              {dictionary?.tier?.[tier] ?? tier}
            </Badge>
          )}
          {countryLabel && (
            <Badge variant="outline" className="text-xs">
              {countryLabel}
            </Badge>
          )}
          {data.nextFollowUpAt && (
            <Badge
              variant={overdue ? "destructive" : "secondary"}
              className="text-xs tabular-nums"
            >
              {new Date(data.nextFollowUpAt).toLocaleDateString(
                isRTL ? "ar-SA" : "en-US"
              )}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.overview}</CardTitle>
          </CardHeader>
          <CardContent>
            <OperatorLeadForm
              mode="edit"
              initialData={data}
              dictionary={dictionary}
              lang={lang}
            />
          </CardContent>
        </Card>

        <LeadActivityLog
          leadId={data.id}
          activities={activities}
          dictionary={dictionary}
          lang={lang}
        />
      </div>
    </div>
  )
}
