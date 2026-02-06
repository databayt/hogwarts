"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Icons } from "@/components/icons"

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function StreamCoursesError({ error, reset }: Props) {
  const params = useParams()
  const lang = (params?.lang as string) || "en"
  const subdomain = params?.subdomain as string
  const isRTL = lang === "ar"

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Stream Courses Error:", error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex w-full justify-center">
            <Icons.alertCircle className="text-destructive size-12" />
          </div>
          <div className="mt-4 w-full text-center">
            <h2 className="text-xl font-semibold">
              {isRTL ? "خطأ في تحميل الدورات" : "Error Loading Courses"}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm text-balance">
              {isRTL
                ? "عذراً، حدث خطأ أثناء تحميل الدورات. يرجى المحاولة مرة أخرى."
                : "Sorry, an error occurred while loading courses. Please try again."}
            </p>
            {error.digest && (
              <p className="text-muted-foreground mt-2 text-xs">
                Error ID: {error.digest}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={reset} className="w-full">
                <Icons.refresh className="size-4" />
                {isRTL ? "إعادة المحاولة" : "Try Again"}
              </Button>
              <Link
                href={`/${lang}/s/${subdomain}/stream`}
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full",
                })}
              >
                <Icons.arrowLeft className="size-4" />
                {isRTL ? "العودة للرئيسية" : "Back to Stream"}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
