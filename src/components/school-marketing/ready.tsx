import Link from "next/link"

import type { Locale } from "@/components/internationalization/config"

import { Button } from "../ui/button"

interface ReadyProps {
  lang?: Locale
  subdomain?: string
}

export function BackgroundGradientAnimationDemo({
  lang = "en",
  subdomain = "demo",
}: ReadyProps) {
  const isRTL = lang === "ar"

  return (
    <section className="py-16 md:py-24">
      <div className="h-[400px] w-full overflow-hidden rounded-lg bg-[#1e40af]">
        <div className="flex h-full items-center justify-center">
          <div className="px-6 text-center">
            <h2 className="font-heading text-3xl font-extrabold text-white md:text-4xl">
              {isRTL
                ? "مستعد لبدء رحلة مليئة بالعجائب؟"
                : "Ready to begin a journey of wonder?"}
            </h2>
            <p className="mx-auto max-w-2xl py-4 text-white/80">
              {isRTL
                ? "كل ساحر عظيم بدأ بخطوة واحدة. اتخذ خطوتك اليوم وانضم إلى آلاف الطلاب الذين اكتشفوا إمكاناتهم في قاعاتنا التعليمية الساحرة."
                : "Every great wizard started with a single step. Take yours today and join thousands of students who have discovered their potential in our enchanted halls of learning."}
            </p>
            <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
              <Link href={`/${lang}/apply`}>
                <Button
                  size="lg"
                  className="text-primary bg-white hover:bg-white/90"
                >
                  {isRTL ? "قدم للقبول" : "Apply for Admission"}
                </Button>
              </Link>
              <Link href={`/${lang}/tour`}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white bg-transparent text-white hover:bg-white/10 hover:text-white/80"
                >
                  {isRTL ? "احجز جولة" : "Schedule a Tour"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
