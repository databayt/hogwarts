"use client"

import { ArrowRight, Book } from "lucide-react"

import { PageActions } from "./page-actions"

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
