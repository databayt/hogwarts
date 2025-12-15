import Link from "next/link"

import { Button } from "@/components/ui/button"
import { HeaderSection } from "@/components/atom/header-section"
import type { Locale } from "@/components/internationalization/config"

import { features } from "../config/landing"
import { Icons } from "../shared/icons"
import MaxWidthWrapper from "../shared/max-width-wrapper"

interface FeaturesProps {
  lang?: Locale
}

export default function Features({ lang }: FeaturesProps) {
  return (
    <section>
      <div className="pt-28 pb-6">
        <MaxWidthWrapper>
          <HeaderSection
            label="Features"
            title="Discover all features."
            subtitle="Harum quae dolore inventore repudiandae? orrupti aut temporibus
          ariatur."
          />

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = Icons[feature.icon || "nextjs"]
              return (
                <div
                  className="group bg-background relative overflow-hidden rounded-2xl border p-5 md:p-8"
                  key={feature.title}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 aspect-video -translate-y-1/2 rounded-full border bg-gradient-to-b from-purple-500/80 to-white opacity-25 blur-2xl duration-300 group-hover:-translate-y-1/4 dark:from-white dark:to-white dark:opacity-5 dark:group-hover:opacity-10"
                  />
                  <div className="relative">
                    <div className="border-border relative flex size-12 rounded-2xl border shadow-sm *:relative *:m-auto *:size-6">
                      <Icon />
                    </div>

                    <p className="text-muted-foreground mt-6 pb-6">
                      {feature.description}
                    </p>

                    <div className="border-muted -mb-5 flex gap-3 border-t py-4 md:-mb-7">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-full px-4"
                      >
                        <Link
                          href={`/${lang}`}
                          className="flex items-center gap-2"
                        >
                          <span>Visit the site</span>
                          <Icons.arrowUpRight className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </MaxWidthWrapper>
      </div>
    </section>
  )
}
