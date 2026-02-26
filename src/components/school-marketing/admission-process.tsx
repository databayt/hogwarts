"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import { BookOpen, MapPin, Sparkles, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import SectionHeading from "../atom/section-heading"

const fallbackStepDescriptions = [
  "Complete our application form online with all required documents and personal information.",
  "Experience our enchanting campus firsthand with a guided tour to all facilities and departments.",
  "Get in touch with faculty members and current students in a welcoming environment.",
  "Complete your enrollment process and officially join our educational family to begin your journey.",
]

const fallbackStepTitles = [
  "Submit Application",
  "Campus Tour",
  "Meet & Greet",
  "Join Family",
]

export function CTA() {
  const [isSafari, setIsSafari] = useState(false)
  const { dictionary } = useDictionary()
  const t = dictionary?.marketing?.site?.process

  const steps = t?.steps as
    | Array<{ title: string; description: string }>
    | undefined
  const stepTitles = steps?.map((s) => s.title) || fallbackStepTitles
  const stepDescriptions =
    steps?.map((s) => s.description) || fallbackStepDescriptions

  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent))
  }, [])

  const admissionSteps = [
    {
      title: stepTitles[0],
      icon: <BookOpen className="h-8 w-8" />,
      color: "bg-gradient-to-br from-blue-400 to-blue-600",
    },
    {
      title: stepTitles[1],
      icon: <MapPin className="h-8 w-8" />,
      color: "bg-gradient-to-br from-purple-400 to-purple-600",
    },
    {
      title: stepTitles[2],
      icon: <Users className="h-8 w-8" />,
      color: "bg-gradient-to-br from-green-400 to-green-600",
    },
    {
      title: stepTitles[3],
      icon: <Sparkles className="h-8 w-8" />,
      color: "bg-gradient-to-br from-yellow-400 to-yellow-600",
    },
  ]

  function renderDot(index: number) {
    return (
      <div
        className="border-background relative z-10 h-10 w-10 shrink-0 overflow-hidden rounded-full border-2"
        style={
          {
            "--gradient-background-start": "rgb(108, 0, 162)",
            "--gradient-background-end": "rgb(0, 17, 82)",
            "--first-color": `${18 + index * 20}, ${113 + index * 30}, ${255 - index * 20}`,
            "--second-color": `${221 - index * 15}, ${74 + index * 25}, ${255 - index * 10}`,
            "--third-color": `${100 + index * 20}, ${220 - index * 15}, ${255 - index * 25}`,
            "--fourth-color": `${200 - index * 10}, ${50 + index * 30}, ${50 + index * 40}`,
            "--fifth-color": `${180 + index * 15}, ${180 - index * 20}, ${50 + index * 35}`,
            "--size": "80%",
            "--blending-value": "hard-light",
          } as React.CSSProperties
        }
      >
        <svg className="hidden">
          <defs>
            <filter id={`blurMe-${index}`}>
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="10"
                result="blur"
              />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                result="goo"
              />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
        </svg>

        <div className="absolute inset-0 rounded-full bg-[linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))]"></div>

        <div
          className={cn(
            "gradients-container absolute inset-0 overflow-hidden rounded-full",
            isSafari
              ? "blur-2xl"
              : "[filter:url(#blurMe-" + index + ")_blur(40px)]"
          )}
        >
          <div
            className={cn(
              "absolute [background:radial-gradient(circle_at_center,_var(--first-color)_0,_var(--first-color)_50%)_no-repeat]",
              "top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)] h-[var(--size)] w-[var(--size)] [mix-blend-mode:var(--blending-value)]",
              "[transform-origin:center_center]",
              "animate-spin",
              "opacity-100"
            )}
            style={{
              animationDuration: `${6 + index * 0.7}s`,
              animationDelay: `${index * 0.3}s`,
            }}
          />
          <div
            className={cn(
              "absolute [background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.8)_0,_rgba(var(--second-color),_0)_50%)_no-repeat]",
              "top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)] h-[var(--size)] w-[var(--size)] [mix-blend-mode:var(--blending-value)]",
              "[transform-origin:calc(50%-20px)]",
              "animate-pulse",
              "opacity-100"
            )}
            style={{
              animationDuration: `${4 + index * 0.5}s`,
              animationDelay: `${index * 0.4}s`,
            }}
          />
          <div
            className={cn(
              "absolute [background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.8)_0,_rgba(var(--third-color),_0)_50%)_no-repeat]",
              "top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)] h-[var(--size)] w-[var(--size)] [mix-blend-mode:var(--blending-value)]",
              "[transform-origin:calc(50%+20px)]",
              "animate-bounce",
              "opacity-100"
            )}
            style={{
              animationDuration: `${8 + index * 0.8}s`,
              animationDelay: `${index * 0.6}s`,
            }}
          />
          <div
            className={cn(
              "absolute [background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.8)_0,_rgba(var(--fourth-color),_0)_50%)_no-repeat]",
              "top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)] h-[var(--size)] w-[var(--size)] [mix-blend-mode:var(--blending-value)]",
              "[transform-origin:calc(50%-10px)]",
              "animate-ping",
              "opacity-70"
            )}
            style={{
              animationDuration: `${8 + index * 1.2}s`,
              animationDelay: `${index * 0.8}s`,
            }}
          />
          <div
            className={cn(
              "absolute [background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.8)_0,_rgba(var(--fifth-color),_0)_50%)_no-repeat]",
              "top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)] h-[var(--size)] w-[var(--size)] [mix-blend-mode:var(--blending-value)]",
              "[transform-origin:calc(50%-40px)_calc(50%+40px)]",
              "animate-spin",
              "opacity-100"
            )}
            style={{
              animationDuration: `${4 + index * 0.9}s`,
              animationDelay: `${index * 0.5}s`,
              animationDirection: "reverse",
            }}
          />
        </div>

        <div
          className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50"
          style={{
            animationDuration: `${3 + index * 0.4}s`,
            animationDelay: `${index * 0.2}s`,
          }}
        ></div>

        <div
          className="absolute -inset-1 -z-10 animate-pulse rounded-full bg-gradient-to-br from-blue-400/20 to-purple-600/20 blur-sm"
          style={{
            animationDuration: `${2.5 + index * 0.6}s`,
            animationDelay: `${index * 0.1}s`,
          }}
        ></div>
      </div>
    )
  }

  return (
    <section className="py-16 md:py-24">
      {/* Admission Process */}
      <div className="">
        <SectionHeading
          title={t?.title || "Process"}
          description={
            t?.description ||
            "Starting your journey is easier than casting a spell."
          }
        />

        {/* Mobile: Vertical Timeline */}
        <div className="relative mt-8 md:hidden">
          {/* Vertical line */}
          <div className="bg-muted-foreground absolute start-5 top-0 bottom-0 w-0.5"></div>

          <div className="flex flex-col gap-8">
            {admissionSteps.map((step, index) => (
              <div key={index} className="relative flex items-start gap-4">
                {renderDot(index)}
                <div className="pt-1">
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground mt-1">
                    {stepDescriptions[index]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Horizontal zigzag Timeline */}
        <div className="relative mt-8 hidden py-28 md:block">
          {/* Timeline line crossing through dots */}
          <div className="bg-muted-foreground absolute start-0 end-0 top-1/2 h-0.5 -translate-y-1/2 transform"></div>

          {/* Timeline items */}
          <div className="relative flex justify-between px-24 py-16">
            {admissionSteps.map((step, index) => (
              <div key={index} className="relative flex flex-col items-center">
                {/* Content above timeline (for dots 2 & 4) */}
                {(index === 1 || index === 3) && (
                  <div className="absolute bottom-12 w-48 text-center">
                    <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                    <p>{stepDescriptions[index]}</p>
                  </div>
                )}

                {/* Dot crossing the line - positioned at center */}
                <div className="relative top-1/2 -translate-y-1/2 transform">
                  {renderDot(index)}
                </div>

                {/* Content below timeline (for dots 1 & 3) */}
                {(index === 0 || index === 2) && (
                  <div className="absolute top-12 w-48 text-center">
                    <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                    <p>{stepDescriptions[index]}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
