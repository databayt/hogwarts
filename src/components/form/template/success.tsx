"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import confetti from "canvas-confetti"
import { ArrowRight, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import type { FormSuccessProps } from "../types"

/**
 * Form Success (Template)
 *
 * Success celebration component for completed forms.
 * Shows confetti animation and optional next steps.
 *
 * **Role**: Celebration organism for form completion
 *
 * **Usage Across App**:
 * - Onboarding completion
 * - Application submission success
 * - Registration completion
 * - Payment success
 * - Any multi-step form completion
 *
 * @example
 * ```tsx
 * <FormSuccess
 *   title="Application Submitted!"
 *   description="We'll review your application and get back to you soon."
 *   showConfetti
 *   nextSteps={[
 *     { label: "Check your email", description: "Confirmation sent" },
 *     { label: "View status", href: "/status" },
 *   ]}
 *   onComplete={() => router.push("/dashboard")}
 * />
 * ```
 */
export function FormSuccess({
  title,
  description,
  onComplete,
  showConfetti = true,
  confettiColors = ["#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b"],
  nextSteps,
  className,
}: FormSuccessProps) {
  const [hasAnimated, setHasAnimated] = React.useState(false)

  // Trigger confetti on mount
  React.useEffect(() => {
    if (showConfetti && !hasAnimated) {
      setHasAnimated(true)

      // Fire confetti
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: confettiColors,
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: confettiColors,
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }

      frame()
    }
  }, [showConfetti, hasAnimated, confettiColors])

  return (
    // CSS entrance (tw-animate-css), not the motion library: this template is
    // re-exported by the form barrel, which put the library in the initial JS
    // of every route with a form wizard. Same stagger as before.
    <div
      className={cn(
        "animate-in fade-in-0 zoom-in-95 flex flex-col items-center space-y-6 py-8 duration-500 ease-out [animation-fill-mode:both] motion-reduce:animate-none",
        className
      )}
    >
      {/* Success icon */}
      <div className="animate-in zoom-in-0 bg-primary/10 flex h-20 w-20 items-center justify-center rounded-full duration-500 [animation-delay:200ms] [animation-fill-mode:both] motion-reduce:animate-none">
        <CheckCircle2 className="text-primary h-10 w-10" />
      </div>

      {/* Title and description */}
      <div className="space-y-2 text-center">
        <h2 className="animate-in fade-in-0 slide-in-from-bottom-2.5 text-2xl font-semibold tracking-tight [animation-delay:300ms] [animation-fill-mode:both] motion-reduce:animate-none">
          {title}
        </h2>
        {description && (
          <p className="animate-in fade-in-0 slide-in-from-bottom-2.5 text-muted-foreground max-w-md [animation-delay:400ms] [animation-fill-mode:both] motion-reduce:animate-none">
            {description}
          </p>
        )}
      </div>

      {/* Next steps */}
      {nextSteps && nextSteps.length > 0 && (
        <div className="animate-in fade-in-0 slide-in-from-bottom-5 w-full max-w-md space-y-3 [animation-delay:500ms] [animation-fill-mode:both] motion-reduce:animate-none">
          <h3 className="text-muted-foreground text-center text-sm font-medium">
            Next Steps
          </h3>
          <div className="space-y-2">
            {nextSteps.map((step, index) => {
              const Icon = step.icon
              const content = (
                <Card
                  className={cn(
                    "transition-colors",
                    (step.href || step.onClick) &&
                      "hover:bg-muted/50 cursor-pointer"
                  )}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    {Icon && (
                      <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                        <Icon className="text-primary h-4 w-4" />
                      </div>
                    )}
                    {!Icon && (
                      <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium">
                        {index + 1}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{step.label}</p>
                      {step.description && (
                        <p className="text-muted-foreground text-xs">
                          {step.description}
                        </p>
                      )}
                    </div>
                    {(step.href || step.onClick) && (
                      <ArrowRight className="text-muted-foreground h-4 w-4 rtl:rotate-180" />
                    )}
                  </CardContent>
                </Card>
              )

              if (step.href) {
                return (
                  <a key={index} href={step.href}>
                    {content}
                  </a>
                )
              }

              if (step.onClick) {
                return (
                  <button
                    key={index}
                    onClick={step.onClick}
                    className="w-full text-start"
                  >
                    {content}
                  </button>
                )
              }

              return <div key={index}>{content}</div>
            })}
          </div>
        </div>
      )}

      {/* Complete button */}
      {onComplete && (
        <div className="animate-in fade-in-0 [animation-delay:700ms] [animation-fill-mode:both] motion-reduce:animate-none">
          <Button onClick={onComplete} size="lg" className="mt-4">
            Continue
            <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
      )}
    </div>
  )
}
