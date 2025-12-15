"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface UserInfoCardProps extends React.ComponentProps<"div"> {
  name: string
  email: string
  avatar?: string
  role?: string
}

export function UserInfoCard({
  name,
  email,
  avatar,
  role,
  className,
  ...props
}: UserInfoCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div
      data-slot="user-info-card"
      className={cn("flex items-center space-x-4", className)}
      {...props}
    >
      <Avatar className="size-8">
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-none font-medium">{name}</p>
        <p className="text-muted-foreground truncate text-sm">{email}</p>
      </div>
    </div>
  )
}
