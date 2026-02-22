"use client"

import PageHeading from "@/components/atom/page-heading"

import { usePageHeading } from "./page-heading-context"

export function PageHeadingDisplay() {
  const { heading } = usePageHeading()

  if (!heading || !heading.title) return null

  return (
    <div className="mb-6">
      <PageHeading title={heading.title} description={heading.description} />
    </div>
  )
}
