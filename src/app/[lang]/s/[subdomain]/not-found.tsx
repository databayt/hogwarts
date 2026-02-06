"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"

const strings = {
  en: {
    title: "Page not found",
    description:
      "This page does not exist on this school site. Check the URL or go back to the dashboard.",
    dashboard: "Dashboard",
    home: "Home",
  },
  ar: {
    title: "الصفحة غير موجودة",
    description:
      "هذه الصفحة غير موجودة في موقع المدرسة. تحقق من الرابط أو عد إلى لوحة التحكم.",
    dashboard: "لوحة التحكم",
    home: "الرئيسية",
  },
}

export default function SchoolNotFound() {
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
      <div className="flex gap-4">
        <Button asChild>
          <Link href={`/${lang}/s/${params?.subdomain}/dashboard`}>
            {t.dashboard}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/${lang}`}>{t.home}</Link>
        </Button>
      </div>
    </div>
  )
}
