"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"

export default function SubmitButton({ title }: { title: string }) {
  const { pending } = useFormStatus()
  return <Button>{pending ? "Please wait..." : title}</Button>
}
