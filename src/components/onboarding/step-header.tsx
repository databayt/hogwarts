"use client"

import React from "react"

interface StepHeaderProps {
  stepNumber?: number
  title: string
  description?: string
  illustration?: React.ReactNode
  dictionary?: any
}

const StepHeader: React.FC<StepHeaderProps> = ({
  stepNumber,
  title,
  description,
  illustration,
  dictionary,
}) => {
  const dict = dictionary?.onboarding || {}
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-12">
        {/* Left Side - Content */}
        <div className="space-y-4 sm:space-y-6">
          {stepNumber && (
            <div className="text-muted-foreground text-sm font-medium sm:text-base">
              {dict.step || "Step"} {stepNumber}
            </div>
          )}

          <h1 className="text-foreground text-4xl leading-tight font-bold">
            {title}
          </h1>

          {description && (
            <p className="text-muted-foreground text-sm leading-relaxed sm:text-base lg:text-lg">
              {description}
            </p>
          )}
        </div>

        {/* Right Side - Illustration */}
        {illustration && (
          <div className="order-first block lg:order-last lg:block">
            <div className="relative">{illustration}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StepHeader
