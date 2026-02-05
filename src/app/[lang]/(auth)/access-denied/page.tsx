import { Suspense } from "react"
import Link from "next/link"
import { ShieldX } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale }>
}

const AccessDeniedPage = async ({ params }: Props) => {
  const { lang } = await params
  // Note: accessDenied translations can be added to dictionary later
  // For now, use English/Arabic based on locale
  const isArabic = lang === "ar"

  const content = {
    title: isArabic ? "تم رفض الوصول" : "Access Denied",
    description: isArabic
      ? "ليس لديك صلاحية للوصول إلى هذه الصفحة. قد يكون السبب:"
      : "You don't have permission to access this page. This could be because:",
    reasons: isArabic
      ? [
          "أنت لست عضواً في هذه المدرسة",
          "حسابك لا يملك الصلاحية المطلوبة",
          "المدرسة لم تمنحك صلاحية الوصول بعد",
        ]
      : [
          "You're not a member of this school",
          "Your account doesn't have the required role",
          "The school hasn't granted you access yet",
        ],
    backHome: isArabic ? "العودة للرئيسية" : "Go Back Home",
  }

  return (
    <Suspense fallback={<div className="h-10" />}>
      <Card className="border-destructive/20 w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
            <ShieldX className="text-destructive size-8" />
          </div>
          <CardTitle className="text-destructive">{content.title}</CardTitle>
          <CardDescription>{content.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            {content.reasons?.map((reason: string, index: number) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 pt-4">
            <Button asChild>
              <Link href={`/${lang}`}>{content.backHome}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Suspense>
  )
}

export default AccessDeniedPage
