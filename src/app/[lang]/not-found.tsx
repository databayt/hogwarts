"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"

const strings = {
  en: {
    title: "Page not found",
    description:
      "The page you are looking for does not exist or has been moved.",
    goHome: "Go home",
  },
  ar: {
    title: "الصفحة غير موجودة",
    description: "الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
    goHome: "الرئيسية",
  },
}

export default function NotFound() {
  const params = useParams()
  const lang = params?.lang === "ar" ? "ar" : "en"
  const t = strings[lang]

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <h2 className="text-2xl font-semibold">{t.title}</h2>
        <p className="text-muted-foreground max-w-md">{t.description}</p>
      </div>
      <Button asChild>
        <Link href={`/${lang}`}>{t.goHome}</Link>
      </Button>
    </div>
  )
}
