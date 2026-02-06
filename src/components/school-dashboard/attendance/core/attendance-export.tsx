"use client"

import React, { useState } from "react"
import { format } from "date-fns"
import {
  Calendar,
  Download,
  FileJson,
  FileText,
  ListFilter,
  LoaderCircle,
  Table2,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DateRangePicker } from "@/components/ui/date-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type {
  AttendanceFilters,
  AttendanceRecord,
  ExportOptions,
} from "../shared/types"
import {
  downloadCSV,
  formatAttendanceDate,
  generateAttendanceCSV,
} from "../shared/utils"

interface AttendanceExportProps {
  records: AttendanceRecord[]
  filters?: AttendanceFilters
  className?: string
  dictionary?: Dictionary["school"]
}

type ExportFormat = "CSV" | "EXCEL" | "PDF" | "JSON"
type GroupByOption = "student" | "class" | "date" | "method" | "none"

export function AttendanceExport({
  records,
  filters,
  className,
  dictionary,
}: AttendanceExportProps) {
  const t = dictionary?.attendance as Record<string, unknown> | undefined
  const exportDict = t?.export as Record<string, string> | undefined
  const statusDict = t?.status as Record<string, string> | undefined
  const methodDict = t?.method as Record<string, string> | undefined

  const [isOpen, setIsOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>("CSV")
  const [groupBy, setGroupBy] = useState<GroupByOption>("none")
  const [includeStats, setIncludeStats] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: filters?.dateFrom
      ? typeof filters.dateFrom === "string"
        ? new Date(filters.dateFrom)
        : filters.dateFrom
      : new Date(new Date().setDate(new Date().getDate() - 30)),
    to: filters?.dateTo
      ? typeof filters.dateTo === "string"
        ? new Date(filters.dateTo)
        : filters.dateTo
      : new Date(),
  })
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    "PRESENT",
    "ABSENT",
    "LATE",
    "EXCUSED",
    "SICK",
    "HOLIDAY",
  ])
  const [selectedMethods, setSelectedMethods] = useState<string[]>([
    "MANUAL",
    "GEOFENCE",
    "QR_CODE",
    "BARCODE",
    "RFID",
    "FINGERPRINT",
    "FACE_RECOGNITION",
    "NFC",
    "BLUETOOTH",
    "BULK_UPLOAD",
  ])

  const handleExport = async () => {
    setExporting(true)

    try {
      // ListFilter records based on selected criteria
      let filteredRecords = records.filter((record) => {
        const recordDate = new Date(record.date)
        const isInDateRange =
          recordDate >= dateRange.from && recordDate <= dateRange.to
        const hasSelectedStatus = selectedStatuses.includes(record.status)
        const hasSelectedMethod = selectedMethods.includes(record.method)

        return isInDateRange && hasSelectedStatus && hasSelectedMethod
      })

      // Group records if requested
      if (groupBy !== "none") {
        filteredRecords = groupRecords(filteredRecords, groupBy)
      }

      // Export based on format
      switch (exportFormat) {
        case "CSV":
          exportAsCSV(filteredRecords)
          break
        case "EXCEL":
          await exportAsExcel(filteredRecords)
          break
        case "PDF":
          await exportAsPDF(filteredRecords)
          break
        case "JSON":
          exportAsJSON(filteredRecords)
          break
      }

      toast({
        title: exportDict?.exportSuccessful || "Export Successful",
        description:
          exportDict?.exportSuccessfulDescription?.replace(
            "{format}",
            exportFormat
          ) || `Attendance data exported as ${exportFormat}`,
      })

      setIsOpen(false)
    } catch (error) {
      toast({
        title: exportDict?.exportFailed || "Export Failed",
        description:
          error instanceof Error
            ? error.message
            : (t?.errors as Record<string, string> | undefined)?.serverError ||
              "Failed to export data",
      })
    } finally {
      setExporting(false)
    }
  }

  const groupRecords = (
    records: AttendanceRecord[],
    groupBy: GroupByOption
  ): AttendanceRecord[] => {
    // Implementation would group records based on the groupBy parameter
    // For now, return records as-is
    return records
  }

  const exportAsCSV = (records: AttendanceRecord[]) => {
    const csv = generateAttendanceCSV(records)
    const filename = `attendance_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`
    downloadCSV(filename, csv)
  }

  const exportAsExcel = async (records: AttendanceRecord[]) => {
    // This would typically use a library like xlsx or exceljs
    // For now, we'll export as CSV with .xlsx extension
    const csv = generateAttendanceCSV(records)
    const filename = `attendance_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`

    // In production, you'd convert CSV to actual Excel format
    toast({
      title: "Note",
      description:
        exportDict?.excelNote ||
        "Excel export is currently in CSV format. Open with Excel to convert.",
    })

    downloadCSV(filename, csv)
  }

  const exportAsPDF = async (records: AttendanceRecord[]) => {
    // This would typically use a library like jsPDF or react-pdf
    // For now, we'll show a message
    toast({
      title: "PDF Export",
      description:
        exportDict?.pdfNote ||
        "PDF export will be available soon. Please use CSV format for now.",
    })
  }

  const exportAsJSON = (records: AttendanceRecord[]) => {
    const json = JSON.stringify(records, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const filename = `attendance_${format(new Date(), "yyyy-MM-dd_HH-mm")}.json`

    link.href = url
    link.download = filename
    link.click()

    URL.revokeObjectURL(url)
  }

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    )
  }

  const toggleMethod = (method: string) => {
    setSelectedMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Download className="me-2 h-4 w-4" />
          {exportDict?.exportData || "Export Data"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {exportDict?.exportAttendanceData || "Export Attendance Data"}
          </DialogTitle>
          <DialogDescription>
            {exportDict?.configureExport ||
              "Configure export options and download attendance records"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Format */}
          <div className="space-y-2">
            <Label>{exportDict?.exportFormat || "Export Format"}</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={(v) => setExportFormat(v as ExportFormat)}
            >
              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="CSV" id="csv" />
                  <Label
                    htmlFor="csv"
                    className="flex cursor-pointer items-center"
                  >
                    <Table2 className="me-1 h-4 w-4" />
                    CSV
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="EXCEL" id="excel" />
                  <Label
                    htmlFor="excel"
                    className="flex cursor-pointer items-center"
                  >
                    <FileText className="me-1 h-4 w-4" />
                    Excel
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="PDF" id="pdf" />
                  <Label
                    htmlFor="pdf"
                    className="flex cursor-pointer items-center"
                  >
                    <FileText className="me-1 h-4 w-4" />
                    PDF
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="JSON" id="json" />
                  <Label
                    htmlFor="json"
                    className="flex cursor-pointer items-center"
                  >
                    <FileJson className="me-1 h-4 w-4" />
                    JSON
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>{exportDict?.dateRange || "Date Range"}</Label>
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onSelect={(range) =>
                setDateRange({
                  from: range.from || new Date(),
                  to: range.to || new Date(),
                })
              }
              placeholder={exportDict?.selectDateRange || "Select date range"}
            />
          </div>

          {/* Status ListFilter */}
          <div className="space-y-2">
            <Label>
              {exportDict?.includeStatusTypes || "Include Status Types"}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  "PRESENT",
                  "ABSENT",
                  "LATE",
                  "EXCUSED",
                  "SICK",
                  "HOLIDAY",
                ] as const
              ).map((status) => (
                <div
                  key={status}
                  className="flex items-center gap-2 rtl:flex-row-reverse"
                >
                  <Checkbox
                    id={status}
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={() => toggleStatus(status)}
                  />
                  <Label htmlFor={status} className="cursor-pointer text-sm">
                    {statusDict?.[status] ||
                      status.charAt(0) + status.slice(1).toLowerCase()}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Method ListFilter */}
          <div className="space-y-2">
            <Label>
              {exportDict?.includeTrackingMethods || "Include Tracking Methods"}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  "MANUAL",
                  "GEOFENCE",
                  "QR_CODE",
                  "BARCODE",
                  "RFID",
                  "FINGERPRINT",
                  "FACE_RECOGNITION",
                  "NFC",
                  "BLUETOOTH",
                  "BULK_UPLOAD",
                ] as const
              ).map((methodKey) => (
                <div
                  key={methodKey}
                  className="flex items-center gap-2 rtl:flex-row-reverse"
                >
                  <Checkbox
                    id={methodKey}
                    checked={selectedMethods.includes(methodKey)}
                    onCheckedChange={() => toggleMethod(methodKey)}
                  />
                  <Label htmlFor={methodKey} className="cursor-pointer text-sm">
                    {methodDict?.[methodKey] || methodKey}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Group By Option */}
          <div className="space-y-2">
            <Label>{exportDict?.groupBy || "Group By"}</Label>
            <Select
              value={groupBy}
              onValueChange={(v) => setGroupBy(v as GroupByOption)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {exportDict?.noGrouping || "No Grouping"}
                </SelectItem>
                <SelectItem value="student">
                  {exportDict?.byStudent || "By Student"}
                </SelectItem>
                <SelectItem value="class">
                  {exportDict?.byClass || "By Class"}
                </SelectItem>
                <SelectItem value="date">
                  {exportDict?.byDate || "By Date"}
                </SelectItem>
                <SelectItem value="method">
                  {exportDict?.byMethod || "By Method"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Options */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 rtl:flex-row-reverse">
              <Checkbox
                id="include-stats"
                checked={includeStats}
                onCheckedChange={(checked) =>
                  setIncludeStats(checked as boolean)
                }
              />
              <Label htmlFor="include-stats" className="cursor-pointer">
                {exportDict?.includeSummaryStatistics ||
                  "Include summary statistics"}
              </Label>
            </div>
          </div>

          {/* Preview Info */}
          <div className="bg-secondary rounded-lg p-4">
            <div className="space-y-1 text-sm">
              <p className="font-medium">
                {exportDict?.exportPreview || "Export Preview:"}
              </p>
              <p className="text-muted-foreground">
                •{" "}
                {exportDict?.format?.replace("{format}", exportFormat) ||
                  `Format: ${exportFormat}`}
              </p>
              <p className="text-muted-foreground">
                •{" "}
                {(t?.reports as Record<string, string> | undefined)?.byDate ||
                  "Date Range"}
                : {formatAttendanceDate(dateRange.from)} -{" "}
                {formatAttendanceDate(dateRange.to)}
              </p>
              <p className="text-muted-foreground">
                •{" "}
                {exportDict?.recordsToExport?.replace(
                  "{count}",
                  String(records.length)
                ) || `Records to export: ${records.length}`}
              </p>
              <p className="text-muted-foreground">
                • {exportDict?.groupBy || "Grouping"}:{" "}
                {groupBy === "none"
                  ? exportDict?.none || "None"
                  : exportDict?.[
                      `by${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}` as keyof typeof exportDict
                    ] || `By ${groupBy}`}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={exporting}
          >
            {(t?.form as Record<string, string> | undefined)?.cancel ||
              "Cancel"}
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || records.length === 0}
          >
            {exporting ? (
              <>
                <LoaderCircle className="me-2 h-4 w-4 animate-spin" />
                {exportDict?.exporting || "Exporting..."}
              </>
            ) : (
              <>
                <Download className="me-2 h-4 w-4" />
                {exportDict?.export || "Export"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
