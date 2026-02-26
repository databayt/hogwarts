// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { CheckCircledIcon } from "@radix-ui/react-icons"

interface FormSuccessProps {
  message?: string
}

export const FormSuccess = ({ message }: FormSuccessProps) => {
  if (!message) return null

  return (
    <div className="flex items-center gap-x-2 rounded-md bg-emerald-500/15 p-3 text-sm text-emerald-500">
      <CheckCircledIcon className="h-4 w-4" />
      <p>{message}</p>
    </div>
  )
}
