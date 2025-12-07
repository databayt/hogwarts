"use client";

import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { LibraryAnimation } from "./library-animation";

interface HeroSectionProps {
  dictionary?: {
    library?: {
      title?: string;
      subtitle?: string;
      navigation?: {
        browse?: string;
        myBooks?: string;
      };
      myProfile?: {
        title?: string;
      };
    };
  };
  lang?: string;
}

export function LibraryHeroSection({ dictionary, lang = "en" }: HeroSectionProps) {
  const isRTL = lang === "ar";

  return (
    <section className="relative">
      <div
        className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${
          isRTL ? "lg:flex-row-reverse" : ""
        }`}
      >
        {/* Text Content */}
        <div
          className={`flex-1 flex flex-col space-y-6 ${
            isRTL ? "items-end text-right" : "items-start text-left"
          } lg:items-start lg:text-left`}
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-none">
            Revelio
            <br />
            <span className="text-3xl md:text-4xl lg:text-5xl font-semibold block mt-2">
              Unlock hidden.
            </span>
          </h1>

          <div
            className={`flex flex-col sm:flex-row gap-4 ${
              isRTL ? "sm:flex-row-reverse" : ""
            }`}
          >
            <Link
              className={buttonVariants({
                size: "lg",
              })}
              href={`/${lang}/library/books`}
            >
              {dictionary?.library?.navigation?.browse || "Browse Books"}
            </Link>

            <Link
              className={buttonVariants({
                size: "lg",
                variant: "ghost",
              })}
              href={`/${lang}/library/my-profile`}
            >
              {dictionary?.library?.navigation?.myBooks || "My Profile"}
            </Link>
          </div>
        </div>

        {/* Animated Book */}
        <div className="flex-1 flex justify-center overflow-hidden max-w-[40%] lg:max-w-[35%]">
          <LibraryAnimation className="w-full max-w-xs h-48 md:h-64" />
        </div>
      </div>
    </section>
  );
}
