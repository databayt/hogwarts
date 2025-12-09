"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EducationAnimation } from "@/components/stream/home/education-animation";

interface LibraryHeroProps {
  lang?: string;
  dictionary?: Record<string, unknown>;
}

export function LibraryHero({ lang = "en", dictionary }: LibraryHeroProps) {
  const isRTL = lang === "ar";

  return (
    <section className="relative">
      <div className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${isRTL ? "lg:flex-row-reverse" : ""}`}>
        {/* Text Content */}
        <div className={`flex-1 flex flex-col space-y-6 ${isRTL ? "items-end text-right" : "items-start text-left"} lg:items-start lg:text-left`}>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-none">
            {(dictionary as any)?.home?.title || "Lumos"}
            <br />
            <span className="text-3xl md:text-4xl lg:text-5xl font-semibold block mt-2">
              {(dictionary as any)?.home?.description || "Shinning a light."}
            </span>
          </h1>

          <div className={`flex flex-col sm:flex-row gap-4 ${isRTL ? "sm:flex-row-reverse" : ""}`}>
            <Link
              className={buttonVariants({
                size: "lg",
              })}
              href={`/${lang}/stream/courses`}
            >
              {(dictionary as any)?.home?.exploreCourses || "Explore Courses"}
            </Link>

            <Link
              className={buttonVariants({
                size: "lg",
                variant: "ghost",
              })}
              href={`/${lang}/login`}
            >
              {(dictionary as any)?.home?.signIn || "Sign in"}
            </Link>
          </div>
        </div>

        {/* Animation */}
        <div className="flex-1 flex justify-center">
          <EducationAnimation className="w-full max-w-lg h-72 md:h-96" />
        </div>
      </div>
    </section>
  );
}
