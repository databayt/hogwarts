"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Paper List Component
 * Shows list of generated papers
 */
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import type { GeneratedPaper } from "@prisma/client"
import { formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { Download, Eye, FileText, MoreHorizontal, Trash2 } from "lucide-react"

import { toast } from "@/hooks/use-toast"
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

import { deletePaper } from "./actions"
import { paperErrorText } from "./error-text"

interface PaperListProps {
  papers: GeneratedPaper[]
  locale: "en" | "ar"
}

export function PaperList({ papers, locale }: PaperListProps) {
  const { dictionary } = useDictionary()
  // Cast to allow new i18n keys not yet in typed dictionary
  const t = dictionary?.generate?.paper?.list as
    | Record<string, string>
    | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tl = (dictionary as any)?.exams?.paper?.list ?? {}
  const isRTL = locale === "ar"
  const dateLocale = isRTL ? ar : enUS
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = (paperId: string) => {
    startTransition(async () => {
      const result = await deletePaper(paperId)
      if (result.success) {
        toast({
          title: tl.deleted ?? "",
          description: tl.paper_deleted ?? "",
        })
        router.refresh()
      } else {
        toast({
          title: dictionary?.generate?.paper?.error ?? "",
          description: paperErrorText(result, dictionary),
          variant: "destructive",
        })
      }
    })
  }

  const paperTitle = (paper: GeneratedPaper) =>
    paper.versionCode
      ? (t?.version_label ?? "").replace("{code}", paper.versionCode)
      : (t?.main_paper ?? "")

  const generatedAgo = (paper: GeneratedPaper) =>
    formatDistanceToNow(new Date(paper.generatedAt), {
      addSuffix: true,
      locale: dateLocale,
    })

  const statusBadge = (paper: GeneratedPaper) =>
    paper.pdfUrl ? (
      <Badge variant="secondary">{t?.ready ?? ""}</Badge>
    ) : (
      <Badge variant="outline">{t?.processing ?? ""}</Badge>
    )

  const rowMenu = (paper: GeneratedPaper) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 md:size-9"
          aria-label={tl.row_actions ?? ""}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? "start" : "end"}>
        <DropdownMenuItem
          disabled={!paper.pdfUrl}
          className="min-h-11 md:min-h-8"
        >
          <Eye className="h-4 w-4" />
          <span className="ms-2">
            {dictionary?.generate?.paper?.preview ?? ""}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!paper.pdfUrl}
          asChild
          className="min-h-11 md:min-h-8"
        >
          {paper.pdfUrl ? (
            <a href={paper.pdfUrl} download>
              <Download className="h-4 w-4" />
              <span className="ms-2">
                {dictionary?.generate?.paper?.generation?.download ?? ""}
              </span>
            </a>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span className="ms-2">
                {dictionary?.generate?.paper?.generation?.download ?? ""}
              </span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive min-h-11 md:min-h-8"
          disabled={isPending}
          onClick={() => handleDelete(paper.id)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="ms-2">{t?.delete ?? ""}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (papers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t?.generated_papers ?? ""}</CardTitle>
          <CardDescription>{t?.no_papers_desc ?? ""}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed px-4">
            <div className="text-muted-foreground flex flex-col items-center gap-2 text-center">
              <FileText className="h-8 w-8" />
              <p className="text-sm">{t?.go_to_generate ?? ""}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t?.generated_papers ?? ""}</CardTitle>
        <CardDescription>
          {(t?.papers_count ?? "").replace("{count}", String(papers.length))}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Phone: stacked cards. md and up: the table. */}
        <ul className="flex flex-col gap-2 md:hidden">
          {papers.map((paper) => (
            <li
              key={paper.id}
              className="flex items-start gap-1 rounded-xl border p-1 ps-4"
            >
              <div className="min-w-0 flex-1 space-y-1.5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 font-medium">
                    <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
                    <span className="break-words">{paperTitle(paper)}</span>
                  </span>
                  <span className="shrink-0">{statusBadge(paper)}</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  {generatedAgo(paper)}
                </p>
              </div>
              {rowMenu(paper)}
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tl.version ?? ""}</TableHead>
                <TableHead>{t?.generated ?? ""}</TableHead>
                <TableHead>{t?.status ?? ""}</TableHead>
                <TableHead className="text-end">{t?.actions ?? ""}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {papers.map((paper) => (
                <TableRow key={paper.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="text-muted-foreground h-4 w-4" />
                      <span className="font-medium">{paperTitle(paper)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {generatedAgo(paper)}
                  </TableCell>
                  <TableCell>{statusBadge(paper)}</TableCell>
                  <TableCell className="text-end">{rowMenu(paper)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
