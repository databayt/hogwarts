"use client"

import * as React from "react"
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { generateCSVFilename } from "@/components/file"
import {
  getAttendanceReport,
  getAttendanceReportCsv,
  getAttendanceStats,
} from "@/components/platform/attendance/actions"

import { downloadExcel, generateAttendanceExcel } from "./excel-generator"
import { downloadPDF, generateAttendancePDF } from "./pdf-generator"

type Filters = {
  classId?: string
  studentId?: string
  status?: string
  from?: string
  to?: string
}

interface AttendanceReportExportButtonProps {
  filters: Filters
  schoolName?: string
  className?: string
  locale?: string
}

type ExportFormat = "csv" | "pdf" | "excel"

export function AttendanceReportExportButton({
  filters,
  schoolName = "School",
  className,
  locale = "en",
}: AttendanceReportExportButtonProps) {
  const [downloading, setDownloading] = React.useState<ExportFormat | null>(
    null
  )
  const isArabic = locale === "ar"

  const getDateRange = () => {
    const from = filters.from
      ? new Date(filters.from)
      : new Date(new Date().setDate(new Date().getDate() - 30))
    const to = filters.to ? new Date(filters.to) : new Date()
    return { from, to }
  }

  const formatFilename = (extension: string) => {
    const dateRange = getDateRange()
    const fromStr = dateRange.from.toISOString().split("T")[0]
    const toStr = dateRange.to.toISOString().split("T")[0]
    return `attendance_report_${fromStr}_${toStr}.${extension}`
  }

  const downloadCSV = async () => {
    setDownloading("csv")
    try {
      const csv = await getAttendanceReportCsv(filters)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = formatFilename("csv")
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting CSV:", error)
    } finally {
      setDownloading(null)
    }
  }

  const downloadPDFReport = async () => {
    setDownloading("pdf")
    try {
      const dateRange = getDateRange()

      // Fetch data for PDF
      const [reportResult, statsResult] = await Promise.all([
        getAttendanceReport({
          dateFrom: dateRange.from.toISOString(),
          dateTo: dateRange.to.toISOString(),
          classId: filters.classId,
          status: filters.status as any,
          limit: 5000,
          offset: 0,
        }),
        getAttendanceStats({
          dateFrom: dateRange.from.toISOString(),
          dateTo: dateRange.to.toISOString(),
          classId: filters.classId,
        }),
      ])

      const records =
        reportResult && "records" in reportResult && reportResult.records
          ? reportResult.records
          : []

      const stats =
        statsResult && !("success" in statsResult && !statsResult.success)
          ? (statsResult as any)
          : null

      const blob = await generateAttendancePDF({
        records: records as any,
        stats,
        dateRange,
        schoolName,
        className,
        locale,
      })

      downloadPDF(blob, formatFilename("pdf"))
    } catch (error) {
      console.error("Error exporting PDF:", error)
    } finally {
      setDownloading(null)
    }
  }

  const downloadExcelReport = async () => {
    setDownloading("excel")
    try {
      const dateRange = getDateRange()

      // Fetch data for Excel
      const [reportResult, statsResult] = await Promise.all([
        getAttendanceReport({
          dateFrom: dateRange.from.toISOString(),
          dateTo: dateRange.to.toISOString(),
          classId: filters.classId,
          status: filters.status as any,
          limit: 10000, // Excel can handle more rows
          offset: 0,
        }),
        getAttendanceStats({
          dateFrom: dateRange.from.toISOString(),
          dateTo: dateRange.to.toISOString(),
          classId: filters.classId,
        }),
      ])

      const records =
        reportResult && "records" in reportResult && reportResult.records
          ? reportResult.records
          : []

      const stats =
        statsResult && !("success" in statsResult && !statsResult.success)
          ? (statsResult as any)
          : null

      const blob = generateAttendanceExcel({
        records: records as any,
        stats,
        dateRange,
        schoolName,
        className,
        locale,
      })

      downloadExcel(blob, formatFilename("xlsx"))
    } catch (error) {
      console.error("Error exporting Excel:", error)
    } finally {
      setDownloading(null)
    }
  }

  const isLoading = downloading !== null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isLoading
            ? isArabic
              ? "جاري التصدير..."
              : "Exporting..."
            : isArabic
              ? "تصدير"
              : "Export"}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>
          {isArabic ? "تنسيق التصدير" : "Export Format"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={downloadCSV}
          disabled={downloading === "csv"}
        >
          <FileText className="mr-2 h-4 w-4" />
          {downloading === "csv" ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              {isArabic ? "جاري..." : "Loading..."}
            </span>
          ) : (
            <span>{isArabic ? "تصدير CSV" : "Export CSV"}</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={downloadExcelReport}
          disabled={downloading === "excel"}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {downloading === "excel" ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              {isArabic ? "جاري..." : "Loading..."}
            </span>
          ) : (
            <span>{isArabic ? "تصدير Excel" : "Export Excel"}</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={downloadPDFReport}
          disabled={downloading === "pdf"}
        >
          <FileText className="mr-2 h-4 w-4 text-red-500" />
          {downloading === "pdf" ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              {isArabic ? "جاري..." : "Loading..."}
            </span>
          ) : (
            <span>{isArabic ? "تصدير PDF" : "Export PDF"}</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Legacy export for backwards compatibility
export { AttendanceReportExportButton as default }
