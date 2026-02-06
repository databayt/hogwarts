"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export interface SettingsToggleRowProps extends React.ComponentProps<"div"> {
  label: string
  description?: string
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  id?: string
}

export function SettingsToggleRow({
  label,
  description,
  checked,
  defaultChecked,
  onCheckedChange,
  id,
  className,
  ...props
}: SettingsToggleRowProps) {
  const switchId = id ?? React.useId()

  return (
    <div
      data-slot="settings-toggle-row"
      className={cn("flex items-center justify-between gap-4", className)}
      {...props}
    >
      <div className="flex-1 space-y-0.5">
        <Label htmlFor={switchId} className="text-base">
          {label}
        </Label>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      <Switch
        id={switchId}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}
