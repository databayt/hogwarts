"use client"

import { Plus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

/**
 * ItemAvatar - User list items with avatars
 *
 * Displays user information with avatar, name, and action buttons.
 *
 * @example
 * ```tsx
 * <ItemAvatar />
 * ```
 */
export function ItemAvatar() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      {/* Single User Item */}
      <div className="flex items-center gap-4 rounded-lg border border-border p-4">
        <Avatar className="size-10">
          <AvatarImage src="https://github.com/maxleiter.png" />
          <AvatarFallback>LR</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="font-medium">Max Leiter</div>
          <p className="text-sm text-muted-foreground">Last seen 5 months ago</p>
        </div>
        <Button
          size="icon"
          variant="outline"
          className="rounded-full"
          aria-label="Invite"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Team Members Item */}
      <div className="flex items-center gap-4 rounded-lg border border-border p-4">
        <div className="flex -space-x-2">
          <Avatar className="hidden size-10 ring-2 ring-background grayscale sm:flex">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar className="hidden size-10 ring-2 ring-background grayscale sm:flex">
            <AvatarImage src="https://github.com/maxleiter.png" alt="@maxleiter" />
            <AvatarFallback>LR</AvatarFallback>
          </Avatar>
          <Avatar className="size-10 ring-2 ring-background grayscale">
            <AvatarImage src="https://github.com/evilrabbit.png" alt="@evilrabbit" />
            <AvatarFallback>ER</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1">
          <div className="font-medium">No Team Members</div>
          <p className="text-sm text-muted-foreground">
            Invite your team to collaborate.
          </p>
        </div>
        <Button size="sm" variant="outline">
          Invite
        </Button>
      </div>
    </div>
  )
}
