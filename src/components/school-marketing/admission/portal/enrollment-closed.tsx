import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { School } from "../../types"

interface Props {
  school: School
  dictionary: Dictionary
  lang: Locale
  subdomain: string
}

export function EnrollmentClosed({ school, lang, subdomain }: Props) {
  const isRTL = lang === "ar"

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 py-16 text-center">
      <div className="text-6xl">{isRTL ? "📋" : "📋"}</div>
      <h2 className="font-heading text-2xl font-bold">
        {isRTL ? "التسجيل مغلق حالياً" : "Enrollment is Currently Closed"}
      </h2>
      <p className="text-muted-foreground">
        {isRTL
          ? `${school.name} لا تقبل طلبات في الوقت الحالي. يرجى زيارة صفحة القبول للاطلاع على المواعيد القادمة.`
          : `${school.name} is not accepting applications at this time. Please visit the admissions page for upcoming enrollment dates.`}
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/${lang}/s/${subdomain}/admissions`}
          className={cn(buttonVariants({ variant: "default" }))}
        >
          {isRTL ? "صفحة القبول" : "View Admissions"}
        </Link>
        <Link
          href={`/${lang}/s/${subdomain}/inquiry`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {isRTL ? "تواصل معنا" : "Contact Us"}
        </Link>
      </div>
    </div>
  )
}
