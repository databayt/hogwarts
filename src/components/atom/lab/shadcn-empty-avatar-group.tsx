"use client"

import { Plus } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

/**
 * ShadcnEmptyAvatarGroup - Empty state with team avatars
 *
 * Empty state component featuring overlapping user avatars and invite CTA.
 *
 * @example
 * ```tsx
 * <ShadcnEmptyAvatarGroup />
 * ```
 */
export function ShadcnEmptyAvatarGroup() {
  return (
    <div className="border-border flex flex-col items-center justify-center space-y-6 rounded-lg border p-12 text-center">
      <div className="flex -space-x-2">
        <Avatar className="ring-background size-12 ring-2 grayscale">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar className="ring-background size-12 ring-2 grayscale">
          <AvatarImage
            src="https://github.com/maxleiter.png"
            alt="@maxleiter"
          />
          <AvatarFallback>LR</AvatarFallback>
        </Avatar>
        <Avatar className="ring-background size-12 ring-2 grayscale">
          <AvatarImage
            src="https://github.com/evilrabbit.png"
            alt="@evilrabbit"
          />
          <AvatarFallback>ER</AvatarFallback>
        </Avatar>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">No Team Members</h3>
        <p className="text-muted-foreground text-sm">
          Invite your team to collaborate on this project.
        </p>
      </div>

      <Button size="sm">
        <Plus className="mr-2 size-4" />
        Invite Members
      </Button>
    </div>
  )
}
