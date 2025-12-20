"use client"

/**
 * Preview Client Component
 * Renders the PDF viewer
 */
import { useEffect, useState } from "react"
import { PDFViewer } from "@react-pdf/renderer"
import { FileWarning, Loader2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ClassicTemplate } from "@/components/platform/exams/paper/templates/classic"
import type { ExamPaperData } from "@/components/platform/exams/paper/types"

interface PreviewClientProps {
  data: ExamPaperData | null
  error?: string
  locale: "en" | "ar"
}

export function PreviewClient({ data, error, locale }: PreviewClientProps) {
  const isRTL = locale === "ar"
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <FileWarning className="h-4 w-4" />
          <AlertTitle>{isRTL ? "خطأ" : "Error"}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          {isRTL ? "لا توجد بيانات للمعاينة" : "No data available for preview"}
        </p>
      </div>
    )
  }

  if (!isMounted) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <PDFViewer width="100%" height="100%" showToolbar>
      <ClassicTemplate data={data} />
    </PDFViewer>
  )
}
