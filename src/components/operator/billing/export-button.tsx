"use client"

import * as React from "react"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"

import { getInvoicesCSV } from "./actions"

interface ExportButtonProps {
  filters?: {
    status?: string
    search?: string
  }
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export function ExportButton({
  filters,
  variant = "outline",
  size = "sm",
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const csv = await getInvoicesCSV(filters)

      // Create blob and download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `invoices-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant={variant}
      size={size}
    >
      <Download className="me-2 h-4 w-4" />
      {isExporting ? "Exporting..." : "Export CSV"}
    </Button>
  )
}
