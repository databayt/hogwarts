"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

import type { StreamContentProps } from "../types"

const steps = [
  {
    id: "plan",
    title: "Plan your curriculum",
    description:
      "You start with your passion and knowledge. Then choose a promising topic with the help of our Marketplace Insights tool.",
    tip: "The way that you teach — what you bring to it — is up to you.",
    helpTitle: "How we help you",
    helpText:
      "We offer plenty of resources on how to create your first course. And, our instructor dashboard and curriculum pages help keep you organized.",
    image: "https://s.udemycdn.com/teaching/plan-your-curriculum-2x-v3.jpg",
  },
  {
    id: "record",
    title: "Record your video",
    description:
      "Use basic tools like a smartphone or a DSLR camera. Add a good microphone and you're ready to start.",
    tip: "If you don't like being on camera, just capture your screen. Either way, we can help you produce your first course.",
    helpTitle: "How we help you",
    helpText:
      "We provide production guidelines, course management features, and support from our Trust & Safety team.",
    image: "https://s.udemycdn.com/teaching/record-your-video-2x-v3.jpg",
  },
  {
    id: "launch",
    title: "Launch your course",
    description:
      "Gather your first ratings and reviews by promoting your course through social media and your professional networks.",
    tip: "Your course will be discoverable in our marketplace where you earn revenue from each paid enrollment.",
    helpTitle: "How we help you",
    helpText:
      "Our custom coupon tool lets you offer enrollment incentives while our global promotions drive traffic to courses.",
    image: "https://s.udemycdn.com/teaching/launch-your-course-2x-v3.jpg",
  },
]

export function HowToBeginSection({
  dictionary,
  lang,
}: Omit<StreamContentProps, "schoolId">) {
  const [activeStep, setActiveStep] = useState(0)
  const isRTL = lang === "ar"

  return (
    <section className="py-16 md:py-24">
      {/* Section Title */}
      <div className="mb-12 text-center">
        <h2 className="font-serif text-3xl font-bold md:text-4xl lg:text-5xl">
          {dictionary?.howToBegin?.title || "How to begin"}
        </h2>
      </div>

      {/* Tabs with underline */}
      <div className="mb-16 flex justify-center">
        <div
          className={cn(
            "border-border inline-flex gap-6 border-b md:gap-12",
            isRTL && "flex-row-reverse"
          )}
        >
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(index)}
              className={cn(
                "relative pb-3 text-sm font-semibold transition-colors md:text-lg",
                activeStep === index
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {dictionary?.howToBegin?.[`tab${index + 1}`] || step.title}
              {activeStep === index && (
                <span className="bg-foreground absolute right-0 bottom-0 left-0 h-0.5" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content - Text left (40%), Image right (60%) */}
      <div
        className={cn(
          "flex flex-col items-center gap-8 md:flex-row md:gap-16",
          isRTL && "md:flex-row-reverse"
        )}
      >
        {/* Text Content */}
        <div
          className={cn(
            "space-y-4 md:w-[40%]",
            isRTL ? "text-right" : "text-left"
          )}
        >
          <p className="text-muted-foreground leading-relaxed">
            {dictionary?.howToBegin?.[`description${activeStep + 1}`] ||
              steps[activeStep].description}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {dictionary?.howToBegin?.[`tip${activeStep + 1}`] ||
              steps[activeStep].tip}
          </p>

          {/* How we help you */}
          <div className="pt-6">
            <h3 className="text-foreground mb-3 font-bold">
              {dictionary?.howToBegin?.helpTitle || steps[activeStep].helpTitle}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {dictionary?.howToBegin?.[`helpText${activeStep + 1}`] ||
                steps[activeStep].helpText}
            </p>
          </div>
        </div>

        {/* Image */}
        <div className="flex justify-center md:w-[60%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={steps[activeStep].image}
            alt={steps[activeStep].title}
            className="w-full max-w-lg"
          />
        </div>
      </div>
    </section>
  )
}
