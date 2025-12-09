"use client";

import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { useLocale } from "@/components/internationalization/use-locale";
import { useDictionary } from "@/components/internationalization/use-dictionary";

interface LibraryHeroProps {
  lang?: string;
}

export function LibraryHero({ lang = "en" }: LibraryHeroProps) {
  const { isRTL, locale } = useLocale();
  const { dictionary } = useDictionary();
  const currentLang = lang || locale;

  const libraryDict = dictionary?.library;

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
            {libraryDict?.title || "Library"}
            <br />
            <span className="text-3xl md:text-4xl lg:text-5xl font-semibold block mt-2 text-muted-foreground">
              {libraryDict?.subtitle || "Discover worlds within pages"}
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl">
            {libraryDict?.description ||
              "Your gateway to knowledge and adventure—from ancient scrolls to modern masterpieces, every book holds a spell waiting to be cast."}
          </p>

          <div
            className={`flex flex-col sm:flex-row gap-4 ${
              isRTL ? "sm:flex-row-reverse" : ""
            }`}
          >
            <Link
              className={buttonVariants({
                size: "lg",
              })}
              href={`/${currentLang}/library/books`}
            >
              {libraryDict?.navigation?.browse || "Browse Books"}
            </Link>

            <Link
              className={buttonVariants({
                size: "lg",
                variant: "outline",
              })}
              href={`/${currentLang}/library/my-profile`}
            >
              {libraryDict?.navigation?.myBooks || "My Books"}
            </Link>
          </div>
        </div>

        {/* Illustration */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-lg aspect-square">
            <Image
              src="/site/harry-potter.png"
              alt="Library illustration"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
