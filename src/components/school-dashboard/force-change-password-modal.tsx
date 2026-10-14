"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// First sign-in after an admin shared a login: the same small, centered
// dialog as "Generate Credentials" (hand-lock hero, two quiet rows), asking
// the person to swap the school's PIN for one only they know. It can't be
// dismissed — the dashboard stays behind it until a new password is saved.
import { useState, useTransition } from "react"
import dynamic from "next/dynamic"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import { setFirstPassword } from "./settings/password/actions"

const HandLock = dynamic(
  () => import("./listings/credentials/hand-lock").then((m) => m.HandLock),
  { ssr: false }
)

export type FirstLoginLabels = Partial<
  Record<
    | "title"
    | "description"
    | "newPassword"
    | "confirmPassword"
    | "placeholder"
    | "mismatch"
    | "tooShort"
    | "sameAsOld"
    | "save"
    | "saving"
    | "failed"
    | "forgotHint",
    string
  >
>

interface ForceChangePasswordModalProps {
  labels?: FirstLoginLabels
}

export function ForceChangePasswordModal({
  labels,
}: ForceChangePasswordModalProps) {
  const t = (key: keyof FirstLoginLabels, fallback: string) =>
    labels?.[key] || fallback
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 4)
      return setError(t("tooShort", "At least 4 characters"))
    if (password !== confirm)
      return setError(t("mismatch", "The two passwords don't match"))

    startTransition(async () => {
      const result = await setFirstPassword({
        newPassword: password,
        confirmPassword: confirm,
      })
      if (result.success) {
        // Reload so the gate re-reads mustChangePassword and steps aside.
        window.location.reload()
        return
      }
      setError(
        result.code === "SAME_AS_OLD"
          ? t(
              "sameAsOld",
              "Choose a different password from the one the school gave you"
            )
          : t("failed", "Couldn't save the password. Try again.")
      )
    })
  }

  return (
    <Dialog open modal>
      <DialogContent
        className="sm:max-w-xs"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader className="items-center text-center">
          <div className="text-foreground mx-auto mb-1 h-20 w-20">
            <HandLock className="h-full w-full" />
          </div>
          <DialogTitle className="text-center">
            {t("title", "Choose your own password")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t(
              "description",
              "You signed in with the PIN the school gave you. Pick a new one only you know — 4 digits is enough."
            )}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={submit}
          className="mx-auto grid w-full max-w-[16rem] gap-3"
        >
          <label className="grid gap-1.5">
            <span className="text-muted-foreground text-xs">
              {t("newPassword", "New password")}
            </span>
            <Input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              dir="ltr"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("placeholder", "4 digits or more")}
              disabled={isPending}
              className="text-center font-mono text-base tracking-widest"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-muted-foreground text-xs">
              {t("confirmPassword", "Type it again")}
            </span>
            <Input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              dir="ltr"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={isPending}
              className="text-center font-mono text-base tracking-widest"
            />
          </label>

          <p
            role="alert"
            className="text-destructive min-h-4 text-center text-xs"
          >
            {error}
          </p>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending
              ? t("saving", "Saving...")
              : t("save", "Save and continue")}
          </Button>

          <p className="text-muted-foreground text-center text-xs">
            {t(
              "forgotHint",
              "Forgot it later? Change it any time in Settings → Password, or ask the school office to reset it."
            )}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
