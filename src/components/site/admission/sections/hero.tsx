import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { AnthropicIcons } from "@/components/icons/anthropic";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface AdmissionHeroProps {
  lang: Locale;
  dictionary?: Dictionary;
}

export function AdmissionHero({ lang, dictionary }: AdmissionHeroProps) {
  const isRTL = lang === "ar";

  return (
    <section className="min-h-[calc(100vh-3.5rem)] flex items-center bg-background relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/site/h.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
      </div>

      <div className="relative mx-auto max-w-7xl px-[clamp(1rem,5vw,3rem)] py-16 md:py-24">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-8">
            <AnthropicIcons.Announcement className="w-4 h-4 text-primary" />
            <span className="text-white text-sm font-medium">
              {isRTL ? "القبول مفتوح الآن" : "Admissions Now Open"}
            </span>
          </div>

          {/* Title - Large, clean typography */}
          <h1 className="font-heading font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-tight mb-6">
            {isRTL ? (
              <>
                <span className="block">ابدأ رحلتك</span>
                <span className="block text-white/70">السحرية</span>
              </>
            ) : (
              <>
                <span className="block">Begin Your</span>
                <span className="block text-white/70">Magical Journey</span>
              </>
            )}
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl">
            {isRTL
              ? "انضم إلى عائلتنا واكتشف إمكاناتك الحقيقية في بيئة تعليمية استثنائية"
              : "Join our family and discover your true potential in an extraordinary educational environment"}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/${lang}/apply`}
              className={cn(buttonVariants({ size: "lg" }), "gap-2")}
            >
              {isRTL ? "قدم الآن" : "Apply Now"}
              <AnthropicIcons.ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/${lang}/tour`}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "gap-2 bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20"
              )}
            >
              <AnthropicIcons.CalendarChart className="w-4 h-4" />
              {isRTL ? "احجز جولة" : "Schedule Tour"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
