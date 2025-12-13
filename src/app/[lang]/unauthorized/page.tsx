import { ShieldX, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization/config"

interface UnauthorizedPageProps {
  params: Promise<{ lang: Locale }>
}

export default async function UnauthorizedPage({ params }: UnauthorizedPageProps) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <ShieldX className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">
          {dictionary?.errors?.unauthorized || "Access Denied"}
        </h1>
        <p className="max-w-md text-muted-foreground">
          {lang === "ar"
            ? "ليس لديك صلاحية للوصول إلى هذه الصفحة. يرجى التواصل مع المسؤول إذا كنت تعتقد أن هذا خطأ."
            : "You don't have permission to access this page. Please contact your administrator if you believe this is an error."}
        </p>
      </div>

      <Alert variant="destructive" className="max-w-md">
        <ShieldX className="h-4 w-4" />
        <AlertTitle>
          {lang === "ar" ? "صلاحيات غير كافية" : "Insufficient Permissions"}
        </AlertTitle>
        <AlertDescription>
          {lang === "ar"
            ? "دورك الحالي لا يتيح لك الوصول إلى هذا المورد. الأدوار المختلفة لها صلاحيات وصول مختلفة."
            : "Your current role does not have access to this resource. Different roles have access to different features."}
        </AlertDescription>
      </Alert>

      <div className="flex gap-4">
        <Button variant="outline" className="gap-2" asChild>
          <Link href={`/${lang}/dashboard`}>
            <ArrowLeft className="h-4 w-4" />
            {dictionary?.common?.back || "Back"} {lang === "ar" ? "للوحة التحكم" : "to Dashboard"}
          </Link>
        </Button>
        <Button variant="ghost" className="gap-2" asChild>
          <Link href={`/${lang}`}>
            <Home className="h-4 w-4" />
            {dictionary?.common?.home || "Home"}
          </Link>
        </Button>
      </div>
    </div>
  )
}
