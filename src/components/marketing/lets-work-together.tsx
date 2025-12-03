import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/icons"
import Link from "next/link"
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface LetsWorkTogetherProps {
    dictionary?: Dictionary
}

export default function LetsWorkTogether({ dictionary }: LetsWorkTogetherProps) {
  const dict = dictionary?.marketing?.letsWorkTogether || {
    title: "Let's Work Together",
    description: "Ready to revolutionize your educational institution with advanced automation? Experience streamlined operations and enhanced learning outcomes for students and educators.",
    emailPlaceholder: "Email address",
    messagePlaceholder: "What educational processes would you like to automate?",
    submit: "Submit",
    liveChat: "Live chat"
  }
  return (
   
  
      <section className="">
        <h1 className="mb-8 text-4xl md:text-5xl font-heading font-extrabold">{dict.title}</h1>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 ">
          <div className="flex-1">
            <p className="muted mb-4">
            {dict.description}
            </p>
            <div className="flex gap-4 mt-4 items-center">
              <Link
                href="https://github.com/abdout/databayt"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Icons.github className="size-7" />
              </Link>
              <Link
                href="https://discord.gg/uPa4gGG62c"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
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
