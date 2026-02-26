"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

import { usePageHeading } from "./page-heading-context"

interface PageHeadingSetterProps {
  title: string
  description?: string
}

export function PageHeadingSetter({
  title,
  description,
}: PageHeadingSetterProps) {
  const { setHeading, clearHeading } = usePageHeading()

  useEffect(() => {
    setHeading({ title, description })
    return () => clearHeading()
  }, [title, description, setHeading, clearHeading])

  return null
}
