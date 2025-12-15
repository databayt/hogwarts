"use client"

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
