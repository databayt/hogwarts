"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRef } from "react"

import { Button } from "@/components/ui/button"
import {
  TitleForm,
  type TitleFormRef,
} from "@/components/onboarding/title/form"

interface Props {
  schoolId: string
  initialTitle: { title: string; subdomain: string }
  dictionary?: any
}

export function ConfigTitleForm({ schoolId, initialTitle, dictionary }: Props) {
  const titleRef = useRef<TitleFormRef>(null)

  return (
    <div className="space-y-2">
      <TitleForm
        ref={titleRef}
        schoolId={schoolId}
        initialData={initialTitle}
        dictionary={dictionary}
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={() => titleRef.current?.saveAndNext()}>
          Save
        </Button>
      </div>
    </div>
  )
}
