// @ts-nocheck
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/atom/icons"

const providerIcons = {
  github: Icons.gitHub,
  google: Icons.google,
  apple: Icons.apple,
  paypal: Icons.paypal,
} as const

export type OAuthProvider = keyof typeof providerIcons

export interface OAuthButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "children"> {
  provider: OAuthProvider
  label?: string
}

export function OAuthButton({
  provider,
  label,
  variant = "outline",
  className,
  ...props
}: OAuthButtonProps) {
  const Icon = providerIcons[provider]
  const defaultLabel = provider.charAt(0).toUpperCase() + provider.slice(1)

  return (
    <Button
      data-slot="oauth-button"
      variant={variant}
      className={cn("gap-2", className)}
      {...props}
    >
      <Icon className="size-4" />
      {label ?? defaultLabel}
    </Button>
  )
}
