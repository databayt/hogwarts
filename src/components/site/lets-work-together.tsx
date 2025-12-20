"use client"

import { Icon } from "@iconify/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useDictionary } from "@/components/internationalization/use-dictionary"

export default function LetsWorkTogether() {
  const { dictionary } = useDictionary()

  // Get translations with fallbacks
  const t = dictionary?.marketing?.letsWorkTogether

  return (
    <section className="py-16 md:py-24">
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
              <Icon icon="mdi:phone" width="30" height="30" />
            </a>
            <a
              href="https://wa.me/966557721603"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact on WhatsApp"
            >
              <Icon icon="ri:whatsapp-fill" width="30" height="30" />
            </a>
            <a
              href="https://www.linkedin.com/company/databayt-automation"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit our LinkedIn"
            >
              <Icon icon="mdi:linkedin" width="30" height="30" />
            </a>
            <Icon icon="mdi:twitter" width="30" height="30" />
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
