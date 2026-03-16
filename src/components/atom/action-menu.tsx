"use client"

import Link from "next/link"
import { Ellipsis, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ActionMenuProps {
  children: React.ReactNode
  align?: "start" | "end"
  srLabel?: string
}

function ActionMenu({
  children,
  align = "end",
  srLabel = "Open menu",
}: ActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <Ellipsis className="h-4 w-4" />
          <span className="sr-only">{srLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

interface ActionMenuItemProps {
  icon?: LucideIcon
  label: string
  onClick?: () => void
  variant?: "destructive"
  href?: string
}

function ActionMenuItem({
  icon: Icon,
  label,
  onClick,
  variant,
  href,
}: ActionMenuItemProps) {
  const className =
    variant === "destructive"
      ? "text-destructive focus:text-destructive"
      : undefined

  if (href) {
    return (
      <DropdownMenuItem asChild className={className}>
        <Link href={href}>
          {Icon && <Icon className="me-2 h-4 w-4" />}
          {label}
        </Link>
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenuItem onClick={onClick} className={className}>
      {Icon && <Icon className="me-2 h-4 w-4" />}
      {label}
    </DropdownMenuItem>
  )
}

export { ActionMenu, ActionMenuItem }
export type { ActionMenuProps, ActionMenuItemProps }
