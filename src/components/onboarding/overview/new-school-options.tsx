"use client"

import React, { useState } from "react"
import { BookOpen, GraduationCap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface NewSchoolOptionsProps {
  onCreateNew?: () => void
  onCreateFromTemplate?: () => void
  dictionary?: any
  locale?: string
}

const NewSchoolOptions: React.FC<NewSchoolOptionsProps> = ({
  onCreateNew,
  onCreateFromTemplate,
  dictionary,
  locale,
}) => {
  const dict = dictionary?.onboarding || {}
  const isRTL = locale === "ar"
  const [isCreating, setIsCreating] = useState(false)
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)

  const handleCreateNew = async () => {
    setIsCreating(true)
    await onCreateNew?.()
  }

  const handleCreateFromTemplate = async () => {
    setIsCreatingTemplate(true)
    await onCreateFromTemplate?.()
  }

  return (
    <div
      className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : "flex-row"}`}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={handleCreateNew}
        disabled={isCreating || isCreatingTemplate}
        className="gap-2"
      >
        {isCreating ? <Spinner /> : <GraduationCap className="h-4 w-4" />}
        {dict.getStarted || "Get started"}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleCreateFromTemplate}
        disabled={isCreating || isCreatingTemplate}
        className="gap-2"
      >
        {isCreatingTemplate ? <Spinner /> : <BookOpen className="h-4 w-4" />}
        {dict.useTemplate || "Use template"}
      </Button>
    </div>
  )
}

export default NewSchoolOptions
