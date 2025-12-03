import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ActionButton {
  label: string
  href: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  icon?: LucideIcon
  iconPosition?: "left" | "right"
  external?: boolean
}

interface PageActionsProps {
  actions: ActionButton[]
  className?: string
}

export function PageActions({ actions, className }: PageActionsProps) {
  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      {actions.map((action, index) => {
        const Icon = action.icon
        const iconElement = Icon && (
          <Icon
            className={cn(
              "h-4 w-4",
              action.iconPosition === "left" ? "mr-2" : "ml-2"
            )}
          />
        )

        return (
          <Button
            key={index}
            variant={action.variant || (index === 0 ? "default" : "outline")}
            asChild
          >
            <Link
              href={action.href}
              target={action.external ? "_blank" : undefined}
              rel={action.external ? "noopener noreferrer" : undefined}
            >
              {action.iconPosition === "left" && iconElement}
              {action.label}
              {action.iconPosition !== "left" && iconElement}
            </Link>
          </Button>
        )
      })}
    </div>
  )
}

// Preset configurations for common use cases
export const commonActions = {
  getStarted: (locale: string): ActionButton => ({
    label: "Get Started",
    href: `/${locale}/docs`,
    icon: ArrowRight,
    iconPosition: "right",
  }),

  documentation: (locale: string): ActionButton => ({
    label: "Documentation",
    href: `/${locale}/docs`,
    variant: "ghost",
  }),

  github: (url: string): ActionButton => ({
    label: "View on GitHub",
    href: url,
    variant: "outline",
    external: true,
  }),
}