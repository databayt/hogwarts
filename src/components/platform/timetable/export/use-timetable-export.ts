"use client"

import { useCallback, useState } from "react"
import { pdf } from "@react-pdf/renderer"

import TimetablePDF from "./timetable-pdf"

interface ExportData {
  title: string
  subtitle: string
  termLabel: string
  schoolName: string
  slots: Array<{
    id: string
    dayOfWeek: number
    periodId: string
    periodName?: string
    subject?: string
    teacher?: string
    room?: string
    className?: string
  }>
  periods: Array<{
    id: string
    name: string
    order: number
    startTime: Date | string
    endTime: Date | string
    isBreak: boolean
  }>
  workingDays: number[]
  lunchAfterPeriod?: number | null
  isRTL?: boolean
}

interface UseTimetableExportOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useTimetableExport(options?: UseTimetableExportOptions) {
  const [isExporting, setIsExporting] = useState(false)

  const exportToPDF = useCallback(
    async (data: ExportData, filename?: string) => {
      setIsExporting(true)

      try {
        // Generate PDF blob
        const blob = await pdf(
          TimetablePDF({
            title: data.title,
            subtitle: data.subtitle,
            termLabel: data.termLabel,
            schoolName: data.schoolName,
            slots: data.slots,
            periods: data.periods,
            workingDays: data.workingDays,
            lunchAfterPeriod: data.lunchAfterPeriod,
            isRTL: data.isRTL,
            generatedAt: new Date(),
          })
        ).toBlob()

        // Create download link
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = filename || `timetable-${Date.now()}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        options?.onSuccess?.()
      } catch (error) {
        console.error("PDF export failed:", error)
        options?.onError?.(
          error instanceof Error ? error : new Error("Export failed")
        )
      } finally {
        setIsExporting(false)
      }
    },
    [options]
  )

  return {
    exportToPDF,
    isExporting,
  }
}

export type { ExportData }
