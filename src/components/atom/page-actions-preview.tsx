"use client"

import { PageActions } from "./page-actions"
import { ArrowRight, Book } from "lucide-react"

export function PageActionsPreview() {
  return (
    <PageActions
      actions={[
        {
          label: "Get Started",
          href: "#",
          icon: ArrowRight,
          iconPosition: "right",
        },
        {
          label: "Documentation",
          href: "#",
          variant: "outline",
          icon: Book,
          iconPosition: "left",
        },
      ]}
    />
  )
}
