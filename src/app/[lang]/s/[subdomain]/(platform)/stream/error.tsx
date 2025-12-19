"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function StreamError({ error, reset }: Props) {
  const params = useParams()
  const lang = (params?.lang as string) || "en"
  const isRTL = lang === "ar"

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Stream Error:", error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex w-full justify-center">
            <AlertCircle className="text-destructive size-12" />
          </div>
          <div className="mt-4 w-full text-center">
            <h2 className="text-xl font-semibold">
              {isRTL ? "حدث خطأ" : "Something went wrong"}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm text-balance">
              {isRTL
                ? "عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى."
                : "Sorry, an unexpected error occurred. Please try again."}
            </p>
            {error.digest && (
              <p className="text-muted-foreground mt-2 text-xs">
                Error ID: {error.digest}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={reset} className="w-full">
                <RefreshCw className="size-4" />
                {isRTL ? "إعادة المحاولة" : "Try Again"}
              </Button>
              <Link
                href={`/${lang}/stream`}
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full",
                })}
              >
                <ArrowLeft className="size-4" />
                {isRTL ? "العودة للرئيسية" : "Back to Stream"}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
