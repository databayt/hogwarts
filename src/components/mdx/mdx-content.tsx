"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"

interface MDXContentProps {
  children: React.ReactNode
}

export function MDXContent({ children }: MDXContentProps) {
  return (
    <div className="mdx prose prose-slate dark:prose-invert max-w-none">
      {children}
    </div>
  )
}
