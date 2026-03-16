"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRef, useState } from "react"

import {
  TitleForm,
  type TitleFormRef,
} from "@/components/onboarding/title/form"

import { useAutoSave } from "./use-auto-save"

interface Props {
  schoolId: string
  initialTitle: { title: string; subdomain: string }
  dictionary?: any
}

export function ConfigTitleForm({ schoolId, initialTitle, dictionary }: Props) {
  const titleRef = useRef<TitleFormRef>(null)
  const [isDirty, setIsDirty] = useState(false)

  useAutoSave(async () => {
    await titleRef.current?.saveAndNext()
    setIsDirty(false)
  }, isDirty)

  return (
    <TitleForm
      ref={titleRef}
      schoolId={schoolId}
      initialData={initialTitle}
      dictionary={dictionary}
      onTitleChange={() => setIsDirty(true)}
    />
  )
}
