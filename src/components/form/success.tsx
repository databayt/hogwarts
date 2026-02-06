"use client"

import * as React from "react"
import confetti from "canvas-confetti"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import type { FormSuccessProps } from "./types"

/**
 * Form Success
 *
 * Success celebration component for completed forms.
 * Shows confetti animation and optional next steps.
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn("flex flex-col items-center space-y-6 py-8", className)}
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-full"
      >
        <CheckCircle2 className="text-primary h-10 w-10" />
      </motion.div>

      {/* Title and description */}
      <div className="space-y-2 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-semibold tracking-tight"
        >
          {title}
        </motion.h2>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground max-w-md"
          >
            {description}
          </motion.p>
        )}
      </div>

      {/* Next steps */}
      {nextSteps && nextSteps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-md space-y-3"
        >
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
        </motion.div>
      )}

      {/* Complete button */}
      {onComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Button onClick={onComplete} size="lg" className="mt-4">
            Continue
            <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
