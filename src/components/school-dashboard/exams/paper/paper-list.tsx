"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Paper List Component
 * Shows list of generated papers
 */
import type { GeneratedPaper } from "@prisma/client"
import { formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { Download, Eye, FileText, MoreHorizontal, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { useDictionary } from "@/components/internationalization/use-dictionary"

interface PaperListProps {
  papers: GeneratedPaper[]
  locale: "en" | "ar"
}

export function PaperList({ papers, locale }: PaperListProps) {
  const { dictionary } = useDictionary()
  const t = dictionary?.generate?.paper?.list
  const isRTL = locale === "ar"
  const dateLocale = isRTL ? ar : enUS

  if (papers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t?.generated_papers || "Generated Papers"}</CardTitle>
          <CardDescription>
            {t?.no_papers_desc || "No papers have been generated yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
            <div className="text-muted-foreground flex flex-col items-center gap-2">
              <FileText className="h-8 w-8" />
              <p className="text-sm">
                {t?.go_to_generate || "Go to Generate tab to create papers"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t?.generated_papers || "Generated Papers"}</CardTitle>
        <CardDescription>
          {(t?.papers_count || "{count} papers generated").replace(
            "{count}",
            String(papers.length)
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {(t?.version_label || "Version {code}").split(" ")[0]}
              </TableHead>
              <TableHead>{t?.generated || "Generated"}</TableHead>
              <TableHead>{t?.status || "Status"}</TableHead>
              <TableHead className="text-end">
                {t?.actions || "Actions"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {papers.map((paper) => (
              <TableRow key={paper.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">
                      {paper.versionCode
                        ? (t?.version_label || "Version {code}").replace(
                            "{code}",
                            paper.versionCode
                          )
                        : t?.main_paper || "Main Paper"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(paper.generatedAt), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </TableCell>
                <TableCell>
                  {paper.pdfUrl ? (
                    <Badge variant="secondary">{t?.ready || "Ready"}</Badge>
                  ) : (
                    <Badge variant="outline">
                      {t?.processing || "Processing"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isRTL ? "start" : "end"}>
                      <DropdownMenuItem disabled={!paper.pdfUrl}>
                        <Eye className="h-4 w-4" />
                        <span className="ms-2">
                          {dictionary?.generate?.paper?.preview || "Preview"}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={!paper.pdfUrl} asChild>
                        {paper.pdfUrl ? (
                          <a href={paper.pdfUrl} download>
                            <Download className="h-4 w-4" />
                            <span className="ms-2">
                              {dictionary?.generate?.paper?.generation
                                ?.download || "Download"}
                            </span>
                          </a>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            <span className="ms-2">
                              {dictionary?.generate?.paper?.generation
                                ?.download || "Download"}
                            </span>
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="ms-2">{t?.delete || "Delete"}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
