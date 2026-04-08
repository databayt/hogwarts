// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"
import { FileText } from "lucide-react"

import { formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getTemplates } from "@/components/school-dashboard/listings/announcements/template-actions"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: `${dictionary.school.announcements.navTemplates} - ${dictionary.school.announcements.title}`,
    description: dictionary.school.announcements.description,
  }
}

export default async function AnnouncementsTemplatesPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.announcements

  const result = await getTemplates()
  const templates = result.success ? result.data : []

  // No templates - show empty state
  if (!templates || templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-muted mb-4 rounded-full p-4">
          <FileText className="text-muted-foreground h-8 w-8" />
        </div>
        <h3 className="font-medium">
          {d?.templates?.noTemplates || "No templates yet"}
        </h3>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          {d?.templates?.description ||
            "Choose a template for your announcement"}
        </p>
      </div>
    )
  }

  // Scope labels
  const scopeLabels: Record<string, string> = {
    school: d?.schoolWide || "School",
    class: d?.classSpecific || "Class",
    role: d?.roleSpecific || "Role",
  }

  // Priority labels
  const priorityLabels: Record<string, string> = {
    low: d?.low || "Low",
    normal: d?.normal || "Normal",
    high: d?.high || "High",
    urgent: d?.priority?.urgent?.label || "Urgent",
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <div
          key={template.id}
          className="bg-background space-y-3 rounded-lg border p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="truncate font-medium">{template.name}</h4>
            {template.isSystem && (
              <Badge variant="secondary" className="shrink-0">
                {lang === "ar" ? "نظام" : "System"}
              </Badge>
            )}
          </div>

          {template.description && (
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {template.description}
            </p>
          )}

          {template.title && (
            <p className="truncate text-sm">{template.title}</p>
          )}

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">
              {scopeLabels[template.scope] || template.scope}
            </Badge>
            <Badge variant="outline">
              {priorityLabels[template.priority] || template.priority}
            </Badge>
            <Badge variant="outline">{template.type}</Badge>
          </div>

          <p className="text-muted-foreground text-xs">
            {formatDate(template.createdAt.toISOString(), lang)}
          </p>
        </div>
      ))}
    </div>
  )
}
