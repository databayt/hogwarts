"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Service-account API token management UI (Phase 4.4 follow-up).
// Lets an ADMIN mint/list/revoke geofence-webhook Bearer tokens from the
// transportation settings page. The plaintext token is shown ONCE on creation
// and is held only in transient component state — never logged or persisted.
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  createApiToken,
  revokeApiToken,
  type ApiTokenRow,
} from "../actions/api-tokens"
import { resolveTransportationError } from "../error-map"

interface Props {
  dictionary: Dictionary
  tokens: ApiTokenRow[]
}

export function TransportationApiTokensSection({ dictionary, tokens }: Props) {
  const t = dictionary.transportation
  const tk = t.settings.tokens
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [plaintext, setPlaintext] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [revokeId, setRevokeId] = useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      // Clear all transient secret state when the dialog closes — the
      // plaintext must never outlive the dialog session.
      setName("")
      setPlaintext(null)
      setCopied(false)
    }
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    startTransition(async () => {
      const result = await createApiToken({ name: name.trim() })
      if (result.success) {
        setPlaintext(result.data.plaintext)
        setCopied(false)
        toast.success(tk.created)
        router.refresh()
      } else {
        toast.error(
          resolveTransportationError(
            t,
            "error" in result ? result.error : undefined
          )
        )
      }
    })
  }

  async function handleCopy() {
    if (!plaintext) return
    try {
      await navigator.clipboard.writeText(plaintext)
      setCopied(true)
      toast.success(tk.copied)
    } catch {
      toast.error(t.errors.internalError)
    }
  }

  function confirmRevoke() {
    if (!revokeId) return
    const id = revokeId
    setRevokeId(null)
    startTransition(async () => {
      const result = await revokeApiToken(id)
      if (result.success) {
        toast.success(tk.revoke)
        router.refresh()
      } else {
        toast.error(
          resolveTransportationError(
            t,
            "error" in result ? result.error : undefined
          )
        )
      }
    })
  }

  function formatLastUsed(value: Date | string | null): string {
    if (!value) return tk.never
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return tk.never
    return date.toLocaleString()
  }

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">{tk.title}</h3>
          <p className="text-muted-foreground text-sm">{tk.subtitle}</p>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>
          {tk.create}
        </Button>
      </header>

      {tokens.length === 0 ? (
        <p className="text-muted-foreground text-sm">{tk.empty}</p>
      ) : (
        <ul className="divide-border divide-y rounded-md border">
          {tokens.map((token) => (
            <li
              key={token.id}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{token.name}</p>
                <p className="text-muted-foreground text-xs">
                  {tk.prefix}: <code>{token.tokenPrefix}…</code>
                </p>
                <p className="text-muted-foreground text-xs">
                  {tk.lastUsed}: {formatLastUsed(token.lastUsedAt)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRevokeId(token.id)}
              >
                {tk.revoke}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          {plaintext === null ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <DialogHeader>
                <DialogTitle>{tk.create}</DialogTitle>
                <DialogDescription>{tk.scope}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-1.5">
                <Label htmlFor="token-name">{tk.name}</Label>
                <Input
                  id="token-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={tk.namePlaceholder}
                  maxLength={64}
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  {dictionary.common.cancel}
                </Button>
                <Button type="submit" disabled={pending || !name.trim()}>
                  {dictionary.common.save}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>{tk.created}</DialogTitle>
                <DialogDescription>{tk.showOnceWarning}</DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={plaintext}
                  className="font-mono text-xs"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button type="button" variant="outline" onClick={handleCopy}>
                  {copied ? tk.copied : tk.copy}
                </Button>
              </div>

              <DialogFooter>
                <Button type="button" onClick={() => handleOpenChange(false)}>
                  {tk.close}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={revokeId !== null}
        onOpenChange={(o) => !o && setRevokeId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tk.revoke}</AlertDialogTitle>
            <AlertDialogDescription>{tk.revokeConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dictionary.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevoke}>
              {tk.revoke}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
