"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Linkedin, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useDictionary } from "@/components/internationalization/use-dictionary"

export default function LetsWorkTogether() {
  const { dictionary } = useDictionary()

  // Get translations with fallbacks
  const t = dictionary?.marketing?.letsWorkTogether

  return (
    <section className="py-16 sm:py-20 md:py-24">
      <h2 className="font-heading pb-2 text-4xl font-extrabold md:text-5xl">
        {t?.title || "Let's Work Together"}
      </h2>
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-14 rtl:lg:flex-row-reverse">
        <div className="flex-1">
          <p>
            {t?.description ||
              "Ready to revolutionize your educational institution with advanced automation? Experience streamlined operations and enhanced learning outcomes for students and educators."}
          </p>
          <div className="flex items-center gap-4 pt-4 rtl:flex-row-reverse">
            <a href="tel:+966557721603" aria-label="Call us">
              <Phone className="h-[30px] w-[30px]" />
            </a>
            <a
              href="https://wa.me/966557721603"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact on WhatsApp"
            >
              <svg
                className="h-[30px] w-[30px]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/company/databayt-automation"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit our LinkedIn"
            >
              <Linkedin className="h-[30px] w-[30px]" />
            </a>
            <svg
              className="h-[30px] w-[30px]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
        </div>
        <div className="flex-1 pt-1">
          <form className="">
            <Input
              placeholder={t?.emailPlaceholder || "Email address"}
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              required
              aria-label="Email"
            />
            <div className="pt-4">
              <Textarea
                placeholder={
                  t?.messagePlaceholder ||
                  "What educational processes would you like to automate?"
                }
                required
                className="min-h-[70px] resize-none"
                aria-label="Educational inquiry"
              />
            </div>
            <div className="flex gap-2 pt-4 rtl:flex-row-reverse">
              <Button type="submit" className="w-fit px-8">
                {t?.submit || "Submit"}
              </Button>
              <Button type="submit" variant="ghost" className="w-fit px-4">
                {t?.liveChat || "Live chat"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
