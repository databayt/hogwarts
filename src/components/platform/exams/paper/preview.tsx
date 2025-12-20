"use client"

/**
 * Paper Preview Component
 * Live PDF preview of the exam paper
 */
import { useEffect, useState } from "react"
import { PDFViewer } from "@react-pdf/renderer"
import { FileWarning, Loader2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { ClassicTemplate } from "./templates/classic"
import type { ExamPaperData } from "./types"

interface PreviewProps {
  data: ExamPaperData | null
  isLoading?: boolean
  error?: string
  locale: "en" | "ar"
}

export function Preview({ data, isLoading, error, locale }: PreviewProps) {
  const isRTL = locale === "ar"
  const [isMounted, setIsMounted] = useState(false)

  // PDFViewer only works on client side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? "معاينة" : "Preview"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[600px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              <p className="text-muted-foreground text-sm">
                {isRTL ? "جاري التحميل..." : "Loading preview..."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? "معاينة" : "Preview"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <FileWarning className="h-4 w-4" />
            <AlertTitle>{isRTL ? "خطأ" : "Error"}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? "معاينة" : "Preview"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[600px] items-center justify-center">
            <p className="text-muted-foreground text-sm">
              {isRTL
                ? "لا توجد بيانات للمعاينة"
                : "No data available for preview"}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? "معاينة" : "Preview"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[600px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isRTL ? "معاينة" : "Preview"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[600px] w-full overflow-hidden rounded-md border">
          <PDFViewer width="100%" height="100%" showToolbar={true}>
            <ClassicTemplate data={data} />
          </PDFViewer>
        </div>
      </CardContent>
    </Card>
  )
}
