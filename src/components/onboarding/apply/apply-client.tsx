"use client"

import React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { useLocale } from "@/components/internationalization/use-locale"

interface Option {
  id: string
  title: string
  description: string
  illustration: string
}

interface ApplyClientProps {
  dictionary: Dictionary["school"]["onboarding"]["apply"]
  lang: Locale
}

const ApplyClient: React.FC<ApplyClientProps> = ({ dictionary, lang }) => {
  const router = useRouter()
  const { update: updateSession } = useSession()
  const [isCreating, setIsCreating] = React.useState(false)
  const { isRTL } = useLocale()

  const options: Option[] = [
    {
      id: "scratch",
      title: dictionary.createFromScratch,
      description: dictionary.createFromScratchDescription,
      illustration:
        "https://www-cdn.anthropic.com/images/4zrzovbb/website/5dfb835ad3cbbf76b85824e969146eac20329e72-1000x1000.svg",
    },
    {
      id: "template",
      title: dictionary.useTemplate,
      description: dictionary.useTemplateDescription,
      illustration:
        "https://www-cdn.anthropic.com/images/4zrzovbb/website/521a945a74f2d25262db4a002073aaeec9bc1919-1000x1000.svg",
    },
  ]

  const handleOptionClick = async (optionId: string) => {
    if (isCreating) return

    setIsCreating(true)

    try {
      if (optionId === "scratch") {
        // Navigate to overview for creating from scratch
        router.push(`/${lang}/onboarding/overview`)
      } else if (optionId === "template") {
        // Navigate to overview with template flag
        router.push(`/${lang}/onboarding/overview?template=true`)
      }
    } catch (error) {
      console.error("Navigation error:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex h-full flex-col px-20">
      <div className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2">
            {/* Left Side - Title */}
            <div>
              <h2 className="text-start text-4xl font-bold tracking-tight">
                {dictionary.title.split("\n").map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < dictionary.title.split("\n").length - 1 && <br />}
                  </React.Fragment>
                ))}
              </h2>
              <p className="text-muted-foreground mt-4 text-start">
                {dictionary.subtitle}
              </p>
            </div>

            {/* Right Side - Options */}
            <div className="space-y-6">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  disabled={isCreating}
                  className="border-border hover:border-primary/50 hover:bg-accent/30 flex w-full items-start justify-between gap-6 rounded-lg border p-4 transition-all rtl:flex-row-reverse"
                >
                  <div className="flex flex-1 gap-3 rtl:flex-row-reverse">
                    <div className="text-start">
                      <h4 className="mb-1 font-semibold">{option.title}</h4>
                      <p className="text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  <div className="hidden flex-shrink-0 justify-end md:flex rtl:justify-start">
                    <div className="relative h-14 w-14 overflow-hidden">
                      <Image
                        src={option.illustration}
                        alt={option.title}
                        fill
                        sizes="56px"
                        className="object-contain"
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section with HR and Button */}
      <div className="mx-auto w-full max-w-7xl">
        <Separator className="w-full" />
        <div className="flex justify-end py-4 rtl:justify-start">
          <Button
            variant="ghost"
            onClick={() => router.push(`/${lang}/onboarding`)}
          >
            {dictionary.back}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ApplyClient
