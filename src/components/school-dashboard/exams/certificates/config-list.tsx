"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { Edit, MoreHorizontal, Star, Trash2 } from "lucide-react"

import { formatDate } from "@/lib/i18n-format"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import {
  deleteCertificateConfig,
  setDefaultCertificateConfig,
} from "./actions"
import type { CertificateConfigSummary } from "./actions/types"

export function CertificateConfigList({
  configs,
}: {
  configs: CertificateConfigSummary[]
}) {
  const { toast } = useToast()
  const { locale } = useLocale()
  const [loading, setLoading] = useState<string | null>(null)
  const { dictionary } = useDictionary()
  const t = dictionary?.school?.exams?.certificates?.config
  const cfl = dictionary?.school?.exams?.configList

  async function handleDelete(id: string) {
    setLoading(id)
    const result = await deleteCertificateConfig(id)
    setLoading(null)

    if (result.success) {
      toast({ title: t?.toast?.deleted ?? "Template deleted" })
    } else if (!result.success) {
      toast({
        title: t?.toast?.error ?? "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  async function handleSetDefault(id: string) {
    setLoading(id)
    const result = await setDefaultCertificateConfig({ id })
    setLoading(null)

    if (result.success) {
      toast({ title: cfl?.defaultSet ?? "Default template updated" })
    } else if (!result.success) {
      toast({
        title: t?.toast?.error ?? "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  if (configs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-medium">
          {cfl?.noTemplatesYet ?? "No templates yet"}
        </h3>
        <p className="text-muted-foreground text-sm">
          {cfl?.createTemplateToStart ??
            "Create a certificate template to get started."}
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t?.headers?.name ?? "Name"}</TableHead>
          <TableHead>{t?.headers?.type ?? "Type"}</TableHead>
          <TableHead>{t?.headers?.style ?? "Style"}</TableHead>
          <TableHead>{t?.headers?.issued ?? "Issued"}</TableHead>
          <TableHead>{t?.headers?.created ?? "Created"}</TableHead>
          <TableHead className="w-[50px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {configs.map((config) => (
          <TableRow key={config.id}>
            <TableCell className="font-medium">
              <span className="inline-flex items-center gap-2">
                {config.name}
                {config.isDefault && (
                  <Badge className="gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {cfl?.defaultBadge ?? "Default"}
                  </Badge>
                )}
              </span>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{config.type}</Badge>
            </TableCell>
            <TableCell className="capitalize">{config.templateStyle}</TableCell>
            <TableCell>{config.certificateCount}</TableCell>
            <TableCell>
              {formatDate(config.createdAt, locale as Locale)}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={loading === config.id}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={`certificates/cert-wizard/${config.id}`}>
                      <Edit className="me-2 h-4 w-4" />
                      {cfl?.edit ?? "Edit"}
                    </a>
                  </DropdownMenuItem>
                  {!config.isDefault && (
                    <DropdownMenuItem
                      onClick={() => handleSetDefault(config.id)}
                    >
                      <Star className="me-2 h-4 w-4" />
                      {cfl?.setAsDefault ?? "Set as default"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(config.id)}
                  >
                    <Trash2 className="me-2 h-4 w-4" />
                    {cfl?.delete ?? "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default CertificateConfigList
