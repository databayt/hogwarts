"use client"

import React from "react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

interface Step {
  number: number
  title: string
  description: string
  illustration: string
}

interface StepsOverviewProps {
  onGetStarted?: () => void
  isLoading?: boolean
}

const StepsOverview: React.FC<StepsOverviewProps> = ({
  onGetStarted,
  isLoading = false,
}) => {
  const steps: Step[] = [
    {
      number: 1,
      title: "Tell us about your school",
      description:
        "Share some basic info, like where it is, and how many students it has.",
      illustration:
        "https://www-cdn.anthropic.com/images/4zrzovbb/website/5dfb835ad3cbbf76b85824e969146eac20329e72-1000x1000.svg",
    },
    {
      number: 2,
      title: "Add people and data",
      description:
        "Invite staff, and import students and classes—we'll help you out.",
      illustration:
        "https://www-cdn.anthropic.com/images/4zrzovbb/website/521a945a74f2d25262db4a002073aaeec9bc1919-1000x1000.svg",
    },
    {
      number: 3,
      title: "Set up and launch",
      description:
        "Configure timetable and attendance, publish announcements, and go live.",
      illustration:
        "https://www-cdn.anthropic.com/images/4zrzovbb/website/0321b0ecbbf53535e93be1310ae1935157bcebdd-1000x1000.svg",
    },
  ]

  return (
    <div className="flex h-full flex-col px-20">
      <div className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2">
            {/* Left Side - Title */}
            <div>
              <h2 className="text-4xl font-bold tracking-tight">
                It's easy to
                <br />
                get started on Hogwarts
              </h2>
            </div>

            {/* Right Side - Steps */}
            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.number} className="flex items-start gap-6">
                  <div className="flex flex-1 gap-3">
                    <div className="flex-shrink-0">
                      <h4 className="text-foreground">{step.number}.</h4>
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold">{step.title}</h4>
                      <p>{step.description}</p>
                    </div>
                  </div>
                  <div className="hidden flex-shrink-0 md:block">
                    <div className="relative h-14 w-14 overflow-hidden">
                      <Image
                        src={step.illustration}
                        alt={step.title}
                        fill
                        sizes="56px"
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section with HR and Button */}
      <div className="mx-auto w-full max-w-7xl">
        <Separator className="w-full" />
        <div className="flex justify-end py-4">
          <Button onClick={onGetStarted} disabled={isLoading}>
            {isLoading ? (
              <>
                <Skeleton className="me-2 h-4 w-4" />
                Creating school...
              </>
            ) : (
              "Get started"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default StepsOverview
