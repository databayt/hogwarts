"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { useLocale } from "@/components/internationalization/use-locale"

interface Stage {
  number: number
  title: string
  description: string
  illustration: string
  bgColor: string
}

interface ApplyOverviewClientProps {
  dictionary: Dictionary["school"]["admission"]
  lang: Locale
  subdomain: string
  schoolName: string
  id?: string
}

const ApplyOverviewClient: React.FC<ApplyOverviewClientProps> = ({
  dictionary,
  lang,
  subdomain,
  schoolName,
  id,
}) => {
  const router = useRouter()
  const [isStarting, setIsStarting] = React.useState(false)
  const { isRTL } = useLocale()

  const overviewDict = dictionary?.apply?.overview ?? {}
  const groupsDict = dictionary?.apply?.groups ?? {}

  const stages: Stage[] = [
    {
      number: 1,
      title: groupsDict.familyEducation || "Documents",
      description:
        overviewDict.stage1Desc ||
        "Upload documents to auto-fill your application",
      illustration:
        "https://d1dlwtcfl0db67.cloudfront.net/anthropic/illustrations/lamp-paper.svg",
      bgColor: "#d97757",
    },
    {
      number: 2,
      title: groupsDict.basicInfo || "Basic Information",
      description:
        overviewDict.stage2Desc ||
        "Enter your personal details and contact information",
      illustration:
        "https://d1dlwtcfl0db67.cloudfront.net/anthropic/illustrations/node-constitution.svg",
      bgColor: "#6a9bcc",
    },
    {
      number: 3,
      title: groupsDict.details || "Details",
      description:
        overviewDict.stage3Desc || "Add guardian info and academic background",
      illustration:
        "https://d1dlwtcfl0db67.cloudfront.net/anthropic/illustrations/hand-abacus.svg",
      bgColor: "#788c5d",
    },
  ]

  const handleGetStarted = async () => {
    if (isStarting || !id) return
    setIsStarting(true)

    try {
      router.push(`/${lang}/application/${id}/attachments`)
    } catch (error) {
      console.error("Navigation error:", error)
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col pb-24">
      <div className="flex flex-1 items-center">
        <div className="w-full">
          <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2">
            {/* Left Side - Title */}
            <div>
              <h2 className="text-start text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                {(() => {
                  const title =
                    overviewDict.title ||
                    "It's easy to get started\nwith {school}"
                  const filled = title.replace("{school}", schoolName)
                  return filled.split("\n").map((line, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <br />}
                      {line}
                    </React.Fragment>
                  ))
                })()}
              </h2>
            </div>

            {/* Right Side - 3 Stages */}
            <div className="space-y-6">
              {stages.map((stage) => (
                <div key={stage.number} className="flex items-start gap-6">
                  <div className="flex flex-1 gap-3">
                    <div className="flex-shrink-0">
                      <h4 className="text-foreground">{`${stage.number}.`}</h4>
                    </div>
                    <div className="text-start">
                      <h4 className="mb-1 font-semibold">{stage.title}</h4>
                      <p className="text-muted-foreground">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                  <div className="hidden flex-shrink-0 md:flex">
                    <div
                      className="relative h-14 w-14 overflow-hidden rounded-lg"
                      style={{ backgroundColor: stage.bgColor }}
                    >
                      <Image
                        src={stage.illustration}
                        alt={stage.title}
                        fill
                        sizes="56px"
                        className="object-contain p-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed footer - matches onboarding pattern */}
      <footer className="bg-background fixed start-0 end-0 bottom-0 px-4 py-3 sm:px-6 sm:py-4 md:px-12 lg:px-20">
        <Separator className="mx-auto mb-3 w-full max-w-5xl sm:mb-4" />
        <div className="mx-auto flex w-full max-w-5xl items-center justify-end">
          <Button
            onClick={handleGetStarted}
            disabled={isStarting || !id}
            className={isRTL ? "px-8" : ""}
          >
            {isStarting
              ? overviewDict.loading || "Loading..."
              : overviewDict.getStarted || "Get Started"}
          </Button>
        </div>
      </footer>
    </div>
  )
}

export default ApplyOverviewClient
