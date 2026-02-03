import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

export const metadata: Metadata = {
  title: "Sales | Analytics",
  description: "Sales analytics and metrics dashboard",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function SalesAnalytics({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.sales

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h2 className="text-muted-foreground text-lg font-medium">
        {lang === "ar" ? "تحليلات المبيعات" : "Sales Analytics"}
      </h2>
      <p className="text-muted-foreground mt-2 text-sm">
        {lang === "ar"
          ? "لوحة تحكم تحليلات المبيعات والمقاييس"
          : "Sales analytics and metrics dashboard"}
      </p>
    </div>
  )
}
