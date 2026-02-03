"use client"

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

interface PaperListProps {
  papers: GeneratedPaper[]
  locale: "en" | "ar"
}

export function PaperList({ papers, locale }: PaperListProps) {
  const isRTL = locale === "ar"
  const dateLocale = isRTL ? ar : enUS

  if (papers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {isRTL ? "الأوراق المولدة" : "Generated Papers"}
          </CardTitle>
          <CardDescription>
            {isRTL
              ? "لم يتم إنشاء أي أوراق بعد"
              : "No papers have been generated yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
            <div className="text-muted-foreground flex flex-col items-center gap-2">
              <FileText className="h-8 w-8" />
              <p className="text-sm">
                {isRTL
                  ? "انتقل إلى تبويب الإنشاء لإنشاء الأوراق"
                  : "Go to Generate tab to create papers"}
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
        <CardTitle>{isRTL ? "الأوراق المولدة" : "Generated Papers"}</CardTitle>
        <CardDescription>
          {isRTL
            ? `${papers.length} ورقة تم إنشاؤها`
            : `${papers.length} papers generated`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isRTL ? "النسخة" : "Version"}</TableHead>
              <TableHead>{isRTL ? "تاريخ الإنشاء" : "Generated"}</TableHead>
              <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
              <TableHead className="text-end">
                {isRTL ? "الإجراءات" : "Actions"}
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
                        ? isRTL
                          ? `نسخة ${paper.versionCode}`
                          : `Version ${paper.versionCode}`
                        : isRTL
                          ? "الورقة الرئيسية"
                          : "Main Paper"}
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
                    <Badge variant="secondary">
                      {isRTL ? "جاهز" : "Ready"}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      {isRTL ? "قيد المعالجة" : "Processing"}
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
                          {isRTL ? "معاينة" : "Preview"}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={!paper.pdfUrl} asChild>
                        {paper.pdfUrl ? (
                          <a href={paper.pdfUrl} download>
                            <Download className="h-4 w-4" />
                            <span className="ms-2">
                              {isRTL ? "تحميل" : "Download"}
                            </span>
                          </a>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            <span className="ms-2">
                              {isRTL ? "تحميل" : "Download"}
                            </span>
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="ms-2">{isRTL ? "حذف" : "Delete"}</span>
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
