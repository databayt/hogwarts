import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface LetsWorkTogetherProps {
  dictionary?: Dictionary
  lang?: Locale
}

export default function LetsWorkTogether({
  dictionary,
  lang,
}: LetsWorkTogetherProps) {
  const isRTL = lang === "ar"
  const dict = dictionary?.marketing?.letsWorkTogether || {
    title: "Let's Work Together",
    description:
      "Ready to revolutionize your educational institution with advanced automation? Experience streamlined operations and enhanced learning outcomes for students and educators.",
    emailPlaceholder: "Email address",
    messagePlaceholder:
      "What educational processes would you like to automate?",
    submit: "Submit",
    liveChat: "Live chat",
  }
  return (
    <section dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="font-heading mb-8 text-4xl font-extrabold md:text-5xl">
        {dict.title}
      </h1>
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-14">
        <div className="flex-1">
          <p className="muted mb-4">{dict.description}</p>
          <div className="mt-4 flex items-center gap-4">
            <Link
              href="https://github.com/abdout/databayt"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <Icons.github className="size-7" />
            </Link>
            <Link
              href="https://discord.gg/uPa4gGG62c"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <Icons.discord className="size-8" />
            </Link>
          </div>
        </div>
        <div className="flex-1 pt-1">
          <form className="space-y-4">
            <Input
              placeholder={dict.emailPlaceholder}
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              required
              aria-label="Email"
            />
            <Textarea
              placeholder={dict.messagePlaceholder}
              required
              className="min-h-[70px] resize-none"
              aria-label="Educational automation needs"
            />
            <div className="flex gap-2">
              <Button type="submit" className="w-fit px-8">
                {dict.submit}
              </Button>
              <Button type="submit" variant="ghost" className="w-fit px-4">
                {dict.liveChat}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
