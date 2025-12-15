"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

import { OAuthButton, type OAuthProvider } from "./oauth-button"

const DEFAULT_PROVIDERS: OAuthProvider[] = [
  "github",
  "google",
  "apple",
  "paypal",
]

export interface OAuthButtonGroupProps extends React.ComponentProps<"div"> {
  providers?: OAuthProvider[]
  labels?: Partial<Record<OAuthProvider, string>>
  onProviderClick?: (provider: OAuthProvider) => void
  columns?: 1 | 2
}

export function OAuthButtonGroup({
  providers = DEFAULT_PROVIDERS,
  labels,
  onProviderClick,
  columns = 2,
  className,
  ...props
}: OAuthButtonGroupProps) {
  return (
    <div
      data-slot="oauth-button-group"
      className={cn(
        "grid gap-4",
        columns === 1 ? "grid-cols-1" : "grid-cols-2",
        className
      )}
      {...props}
    >
      {providers.map((provider) => (
        <OAuthButton
          key={provider}
          provider={provider}
          label={labels?.[provider]}
          onClick={() => onProviderClick?.(provider)}
        />
      ))}
    </div>
  )
}
