"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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
