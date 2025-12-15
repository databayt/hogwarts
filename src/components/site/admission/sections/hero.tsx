import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { AnthropicIcons } from "@/components/icons/anthropic"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { AdmissionHeroIllustration } from "./hero-illustration"

interface AdmissionHeroProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AdmissionHero({ lang, dictionary }: AdmissionHeroProps) {
  const isRTL = lang === "ar"

  return (
    <section id="hero" className="bg-background min-h-[calc(100vh-3.5rem)]">
      <div className="grid min-h-[calc(100vh-3.5rem)] grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
        {/* Left: Content */}
        <div className={cn("space-y-6 py-12 lg:py-0", isRTL && "lg:order-2")}>
          <h1 className="font-heading text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
            {isRTL ? (
              <>
                <span className="block">خطاب</span>
                <span className="block">هوجورتس</span>
              </>
            ) : (
              <>
                <span className="block">Hogwarts</span>
                <span className="block">letter</span>
              </>
            )}
          </h1>

          <p className="text-muted-foreground max-w-md text-lg">
            {isRTL
              ? "سيتم تسليم خطاب هوجورتس الخاص بك عبر بريد البوم في عيد ميلادك الحادي عشر. إذا لم تستلمه بحلول ذلك الوقت، يرجى مراجعة مكتب وزارة السحر المحلي."
              : "Your Hogwarts letter will be delivered by owl post on your 11th birthday. If you haven't received it by then, please check with your local Ministry of Magic office."}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/${lang}/apply`}
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              {isRTL ? "قدم الآن" : "Start application"}
            </Link>
            <Link
              href={`/${lang}/admissions`}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "group w-full sm:w-auto"
              )}
            >
              {isRTL ? "تعرف على المزيد" : "Learn more"}
              <AnthropicIcons.ArrowRight className="ms-2 h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Right: Illustration - hidden on mobile/tablet for performance */}
        <div
          className={cn(
            "hidden items-center justify-center lg:flex lg:justify-end",
            isRTL && "lg:order-1 lg:justify-start"
          )}
        >
          <AdmissionHeroIllustration />
        </div>
      </div>
    </section>
  )
}
