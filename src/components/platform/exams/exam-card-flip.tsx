"use client"

import { cn } from "@/lib/utils"
import { ArrowRight, GraduationCap } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

interface ExamCardFlipProps {
  title?: string
  subtitle?: string
  description?: string
  features?: string[]
  href?: string
  ctaText?: string
  stats?: {
    label: string
    value: string | number
  }
}

export function ExamCardFlip({
  title = "Examinations",
  subtitle = "Manage your exams",
  description = "Complete exam management with question banks, auto-generation, and AI marking.",
  features = ["Question Bank", "AI Generation", "Auto Marking", "Results"],
  href = "/exams",
  ctaText = "View Overview",
  stats,
}: ExamCardFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div
      className="group relative h-[320px] w-full [perspective:2000px]"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={cn(
          "relative h-full w-full",
          "[transform-style:preserve-3d]",
          "transition-all duration-700",
          isFlipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]"
        )}
      >
        {/* Front of card */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            "[backface-visibility:hidden] [transform:rotateY(0deg)]",
            "overflow-hidden rounded-2xl",
            "bg-card",
            "border",
            "shadow-sm",
            "transition-all duration-700",
            "group-hover:shadow-lg",
            isFlipped ? "opacity-0" : "opacity-100"
          )}
        >
          <div className="relative h-full overflow-hidden bg-gradient-to-b from-primary/5 to-background">
            <div className="absolute inset-0 flex items-start justify-center pt-16">
              <div className="relative flex h-[120px] w-[200px] items-center justify-center">
                {/* Animated rings with primary color */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "absolute h-[60px] w-[60px]",
                      "rounded-full",
                      "animate-pulse",
                      "opacity-20",
                      "bg-primary/30"
                    )}
                    style={{
                      animationDelay: `${i * 0.3}s`,
                      transform: `scale(${1 + i * 0.25})`,
                    }}
                  />
                ))}
                {/* Center icon */}
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
              </div>
            </div>

            {/* Stats badge */}
            {stats && (
              <div className="absolute top-4 right-4">
                <div className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  {stats.value} {stats.label}
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold leading-snug tracking-tight text-foreground transition-all duration-500 ease-out group-hover:translate-y-[-4px]">
                  {title}
                </h3>
                <p className="line-clamp-2 text-sm tracking-tight text-muted-foreground transition-all delay-[50ms] duration-500 ease-out group-hover:translate-y-[-4px]">
                  {subtitle}
                </p>
              </div>
              <div className="group/icon relative">
                <div
                  className={cn(
                    "absolute inset-[-8px] rounded-lg transition-opacity duration-300",
                    "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent"
                  )}
                />
                <GraduationCap className="relative z-10 h-5 w-5 text-primary transition-transform duration-300 group-hover/icon:-rotate-12 group-hover/icon:scale-110" />
              </div>
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            "[backface-visibility:hidden] [transform:rotateY(180deg)]",
            "flex flex-col rounded-2xl border p-6",
            "bg-gradient-to-b from-primary/5 to-background",
            "shadow-sm",
            "transition-all duration-700",
            "group-hover:shadow-lg",
            !isFlipped ? "opacity-0" : "opacity-100"
          )}
        >
          <div className="flex-1 space-y-5">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold leading-snug tracking-tight text-foreground transition-all duration-500 ease-out group-hover:translate-y-[-2px]">
                {title}
              </h3>
              <p className="line-clamp-3 text-sm tracking-tight text-muted-foreground transition-all duration-500 ease-out group-hover:translate-y-[-2px]">
                {description}
              </p>
            </div>

            <div className="space-y-2">
              {features.map((feature, index) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-sm text-foreground transition-all duration-500"
                  style={{
                    transform: isFlipped ? "translateX(0)" : "translateX(-10px)",
                    opacity: isFlipped ? 1 : 0,
                    transitionDelay: `${index * 100 + 200}ms`,
                  }}
                >
                  <ArrowRight className="h-3 w-3 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <Link
              href={href}
              className={cn(
                "group/start relative",
                "flex items-center justify-between",
                "-m-3 rounded-xl p-3",
                "transition-all duration-300",
                "bg-muted/50",
                "hover:bg-primary/10",
                "hover:scale-[1.02]"
              )}
            >
              <span className="text-sm font-medium text-foreground transition-colors duration-300 group-hover/start:text-primary">
                {ctaText}
              </span>
              <div className="group/icon relative">
                <div
                  className={cn(
                    "absolute inset-[-6px] rounded-lg transition-all duration-300",
                    "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent",
                    "scale-90 opacity-0 group-hover/start:scale-100 group-hover/start:opacity-100"
                  )}
                />
                <ArrowRight className="relative z-10 h-4 w-4 text-primary transition-all duration-300 group-hover/start:translate-x-0.5 group-hover/start:scale-110" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
