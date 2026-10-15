"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The school on/off switch, moved here from the plan page: one red row in a
 * "Danger zone" group, confirmed in an AlertDialog. Writes through
 * `updatePlanLimits({ isActive })`, which only a DEVELOPER may call.
 */
import { useState, useTransition } from "react"
import { Loader2, Power } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { ErrorToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { updatePlanLimits } from "./actions"
import { SettingsGroup, SettingsRow } from "./ui/settings-group"

interface Props {
  schoolId: string
  isActive: boolean
  t: Dictionary["schoolBilling"]
}

export function ConfigDangerZone({ schoolId, isActive, t }: Props) {
  const d = t.dangerZone
  const [active, setActive] = useState(isActive)
  const [isPending, startTransition] = useTransition()

  function confirm() {
    const next = !active
    startTransition(async () => {
      const result = await updatePlanLimits(schoolId, { isActive: next })
      if (result.success) setActive(next)
      else ErrorToast(result.error || t.errors.saveFailed)
    })
  }

  return (
    <SettingsGroup
      title={<span className="text-destructive">{d.title}</span>}
      footer={d.footer}
      className="[&>div]:border-destructive/30"
    >
      <SettingsRow
        icon={<Power className="text-destructive" />}
        label={active ? d.statusActive : d.statusInactive}
        description={active ? d.deactivateDescription : d.reactivateDescription}
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant={active ? "destructive" : "outline"}
              size="sm"
              className="rounded-full"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {active ? d.deactivate : d.reactivate}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {active ? d.confirmDeactivateTitle : d.confirmReactivateTitle}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {active ? d.confirmDeactivateBody : d.confirmReactivateBody}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{d.cancel}</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirm}
                className={cn(
                  active && buttonVariants({ variant: "destructive" })
                )}
              >
                {active ? d.deactivate : d.reactivate}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SettingsRow>
    </SettingsGroup>
  )
}
