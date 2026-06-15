"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { CircleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

const COPY = {
  ar: {
    title: "تعذّر تحميل الملف الشخصي",
    description: "حدث خطأ غير متوقع. حاول مرة أخرى.",
    retry: "إعادة المحاولة",
  },
  en: {
    title: "Couldn't load this profile",
    description: "Something went wrong. Please try again.",
    retry: "Try again",
  },
} as const

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const pathname = usePathname()
  const lang = pathname?.split("/")[1] === "ar" ? "ar" : "en"
  const t = COPY[lang]

  useEffect(() => {
    console.error("Profile route error:", error)
  }, [error])

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <CircleAlert className="h-4 w-4" />
        <AlertTitle>{t.title}</AlertTitle>
        <AlertDescription>{t.description}</AlertDescription>
      </Alert>
      <Button onClick={reset}>{t.retry}</Button>
    </div>
  )
}
