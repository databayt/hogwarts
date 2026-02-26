"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"

import { CardWrapper } from "@/components/auth/card-wrapper"

export const ErrorCard = () => {
  return (
    <CardWrapper
      headerLabel="Oops! Something went wrong!"
      backButtonHref="/login"
      backButtonLabel="Back to login"
    >
      <div className="flex w-full items-center justify-center">
        <ExclamationTriangleIcon className="text-destructive" />
      </div>
    </CardWrapper>
  )
}
