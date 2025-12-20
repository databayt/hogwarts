"use client"

import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

import { LibraryAnimation } from "./library-animation"

interface HeroSectionProps {
  dictionary?: {
    library?: {
      title?: string
      subtitle?: string
      navigation?: {
        browse?: string
        myBooks?: string
      }
      myProfile?: {
        title?: string
      }
    }
  }
  lang?: string
}

export function LibraryHeroSection({
  dictionary,
  lang = "en",
}: HeroSectionProps) {
  return (
    <section className="relative">
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-12 lg:rtl:flex-row-reverse">
        {/* Text Content */}
        <div className="flex flex-col items-start space-y-6 text-start lg:items-start lg:text-start">
          <h1 className="text-5xl leading-none font-extrabold tracking-tighter md:text-6xl lg:text-7xl">
            Revelio
            <br />
            <span className="mt-2 block text-3xl font-semibold md:text-4xl lg:text-5xl">
              Unlock hidden.
            </span>
          </h1>

          <div className="flex flex-col gap-4 sm:flex-row sm:rtl:flex-row-reverse">
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
        <div className="-ml-5 shrink-0">
          <LibraryAnimation className="h-64 w-64 lg:h-80 lg:w-80" />
        </div>
      </div>
    </section>
  )
}
