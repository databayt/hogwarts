"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { useDictionary } from "@/components/internationalization/use-dictionary"

export default function SubmitButton({ title }: { title: string }) {
  const { pending } = useFormStatus()
  const { dictionary } = useDictionary()
  const t = (dictionary as any)?.finance?.invoiceMisc

  return <Button>{pending ? t?.pleaseWait || "Please wait..." : title}</Button>
}
