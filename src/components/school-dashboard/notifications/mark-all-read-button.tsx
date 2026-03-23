"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCheck, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"

import { markAllNotificationsAsRead } from "./actions"

interface MarkAllReadButtonProps {
  label: string
  unreadCount: number
}

export function MarkAllReadButton({
  label,
  unreadCount,
}: MarkAllReadButtonProps) {
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (unreadCount === 0) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2"
      disabled={isPending || !session?.user?.id}
      onClick={() => {
        if (!session?.user?.id) return
        startTransition(async () => {
          await markAllNotificationsAsRead({ userId: session.user.id })
          router.refresh()
        })
      }}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCheck className="h-4 w-4" />
      )}
      {label}
    </Button>
  )
}
