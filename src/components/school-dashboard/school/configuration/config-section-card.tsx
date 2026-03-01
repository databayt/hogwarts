// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { ConfigSection } from "./config-sections"

interface Props {
  section: ConfigSection
  title: string
  description: string
  status: "configured" | "incomplete" | "notSet"
  statusLabel: string
  lang: string
}

export function ConfigSectionCard({
  section,
  title,
  description,
  status,
  statusLabel,
  lang,
}: Props) {
  const Icon = section.icon

  return (
    <Link href={`/${lang}/school/configuration/${section.route}`}>
      <Card className="hover:border-primary/50 h-full transition-colors hover:shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className={`bg-muted rounded-lg p-2 ${section.iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            {status === "configured" && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {statusLabel}
              </Badge>
            )}
            {status === "incomplete" && (
              <Badge variant="secondary" className="gap-1">
                {statusLabel}
              </Badge>
            )}
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
