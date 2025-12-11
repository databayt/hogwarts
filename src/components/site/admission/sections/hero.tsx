import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { AnthropicIcons } from "@/components/icons/anthropic";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { AdmissionHeroIllustration } from "./hero-illustration";

interface AdmissionHeroProps {
  lang: Locale;
  dictionary?: Dictionary;
}

export function AdmissionHero({ lang, dictionary }: AdmissionHeroProps) {
  const isRTL = lang === "ar";

  return (
    <section id="hero" className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[calc(100vh-3.5rem)]">
        {/* Left: Content */}
        <div className={cn("space-y-6 py-12 lg:py-0", isRTL && "lg:order-2")}>
          <h1 className="font-heading font-black text-5xl sm:text-6xl lg:text-7xl xl:text-8xl tracking-tight">
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

          <p className="text-muted-foreground text-lg max-w-md">
            {isRTL
              ? "سيتم تسليم خطاب هوجورتس الخاص بك عبر بريد البوم في عيد ميلادك الحادي عشر. إذا لم تستلمه بحلول ذلك الوقت، يرجى مراجعة مكتب وزارة السحر المحلي."
              : "Your Hogwarts letter will be delivered by owl post on your 11th birthday. If you haven't received it by then, please check with your local Ministry of Magic office."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/${lang}/apply`}
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              {isRTL ? "قدم الآن" : "Start application"}
            </Link>
            <Link
              href={`/${lang}/admissions`}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto group")}
            >
              {isRTL ? "تعرف على المزيد" : "Learn more"}
              <AnthropicIcons.ArrowRight className="w-4 h-4 ms-2 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Right: Illustration - hidden on mobile/tablet for performance */}
        <div className={cn("hidden lg:flex justify-center lg:justify-end items-center", isRTL && "lg:order-1 lg:justify-start")}>
          <AdmissionHeroIllustration />
        </div>
      </div>
    </section>
  );
}
