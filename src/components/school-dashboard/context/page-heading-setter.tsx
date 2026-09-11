"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

import { usePageHeading } from "./page-heading-context"

interface PageHeadingSetterProps {
  title: string
  description?: string
  /** Hide the heading below `md`; see PageHeadingData.hideOnMobile. */
  hideOnMobile?: boolean
}

export function PageHeadingSetter({
  title,
  description,
  hideOnMobile,
}: PageHeadingSetterProps) {
  const { setHeading, clearHeading } = usePageHeading()

  useEffect(() => {
    setHeading({ title, description, hideOnMobile })
    return () => clearHeading()
  }, [title, description, hideOnMobile, setHeading, clearHeading])

  return null
}
