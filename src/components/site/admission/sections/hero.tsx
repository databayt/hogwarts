"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { AnthropicIcons } from "@/components/icons/anthropic";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";

// Dynamic import for Lottie to avoid SSR issues
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface AdmissionHeroProps {
  lang: Locale;
  dictionary?: Dictionary;
}

// Lottie animation data URL - using a similar animation style
const ANIMATION_URL = "https://cdn.prod.website-files.com/6889473510b50328dbb70ae6/68c00420bab94b062559518b_API.json";

export function AdmissionHero({ lang, dictionary }: AdmissionHeroProps) {
  const isRTL = lang === "ar";

  return (
    <section className="relative bg-background overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,119,87,0.15),rgba(255,255,255,0))]" />

      {/* Top spacer */}
      <div className="h-[clamp(4rem,12vh,8rem)]" />

      {/* Main content container */}
      <div className="mx-auto max-w-7xl px-[clamp(1rem,5vw,3rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left column - Content */}
          <div className={cn("order-2 lg:order-1", isRTL && "lg:order-2")}>
            {/* Title with word-by-word animation style */}
            <div className="mb-6">
              <h1 className="font-heading text-[clamp(2.5rem,5vw,4rem)] font-bold tracking-tight leading-[1.1] text-foreground">
                {isRTL ? (
                  <>
                    <span className="inline-block">ابدأ</span>{" "}
                    <span className="inline-block">رحلتك</span>{" "}
                    <span className="inline-block">التعليمية</span>{" "}
                    <span className="inline-block">الاستثنائية</span>
                  </>
                ) : (
                  <>
                    <span className="inline-block">Begin</span>{" "}
                    <span className="inline-block">Your</span>{" "}
                    <span className="inline-block">Extraordinary</span>{" "}
                    <span className="inline-block">Journey</span>
                  </>
                )}
              </h1>
            </div>

            {/* Description */}
            <div className="mb-8">
              <p className="text-[clamp(1rem,1.5vw,1.25rem)] text-muted-foreground leading-relaxed max-w-[60ch]">
                {isRTL
                  ? "قدم طلبك للانضمام إلى مجتمعنا التعليمي واكتشف بيئة تعليمية متميزة تنمي مواهبك وتطلق إمكاناتك."
                  : "Apply to join our educational community and discover an exceptional learning environment that nurtures your talents and unlocks your potential."}
              </p>
            </div>

            {/* CTAs - matching Claude API style */}
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/${lang}/apply`}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 px-6 text-base font-medium gap-2 group"
                )}
              >
                {isRTL ? "قدم الآن" : "Start application"}
              </Link>
              <Link
                href={`/${lang}/admissions`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 px-6 text-base font-medium gap-2 group"
                )}
              >
                {isRTL ? "تعرف على المزيد" : "Learn more"}
                <AnthropicIcons.ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right column - Animation */}
          <div className={cn("order-1 lg:order-2 flex items-center justify-center", isRTL && "lg:order-1")}>
            <div className="relative w-full max-w-[500px] aspect-square">
              <Suspense fallback={
                <div className="w-full h-full bg-muted/20 rounded-full animate-pulse" />
              }>
                <LottieAnimation />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="h-[clamp(4rem,12vh,8rem)]" />
    </section>
  );
}

// Separate component for Lottie animation that fetches the JSON
function LottieAnimation() {
  const [animationData, setAnimationData] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(ANIMATION_URL)
      .then((res) => res.json())
      .then((data) => {
        setAnimationData(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading || !animationData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-3/4 h-3/4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
