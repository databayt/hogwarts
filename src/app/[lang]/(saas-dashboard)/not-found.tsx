"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const strings = {
  en: {
    title: "Page not found",
    description:
      "The dashboard page you are looking for does not exist or has been moved.",
    dashboard: "Dashboard",
    home: "Home",
  },
  ar: {
    title: "الصفحة غير موجودة",
    description: "صفحة لوحة التحكم التي تبحث عنها غير موجودة أو تم نقلها.",
    dashboard: "لوحة التحكم",
    home: "الرئيسية",
  },
}

export default function SaasDashboardNotFound() {
  const params = useParams()
  const lang = params?.lang === "ar" ? "ar" : "en"
  const t = strings[lang]

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <span className="text-muted-foreground text-xl font-bold">?</span>
          </div>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button className="flex-1" asChild>
              <Link href={`/${lang}/dashboard`}>{t.dashboard}</Link>
            </Button>
            <Button className="flex-1" variant="outline" asChild>
              <Link href={`/${lang}`}>{t.home}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
