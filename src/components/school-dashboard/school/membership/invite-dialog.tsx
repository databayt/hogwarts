"use client"

import { useState, useTransition } from "react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"

import { inviteMember } from "./actions"
import { roleLabel } from "./labels"

const ROLE_OPTIONS = [
  "STAFF",
  "TEACHER",
  "ADMIN",
  "ACCOUNTANT",
  "STUDENT",
  "GUARDIAN",
] as const

interface InviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  t: Record<string, string>
}

export function InviteDialog({
  open,
  onOpenChange,
  onSuccess,
  t,
}: InviteDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("STAFF")
  const [name, setName] = useState("")

  const handleSubmit = () => {
    if (!email) return

    startTransition(async () => {
      const result = await inviteMember({
        email,
        role: role as
          | "ADMIN"
          | "TEACHER"
          | "STUDENT"
          | "GUARDIAN"
          | "ACCOUNTANT"
          | "STAFF",
        name: name || undefined,
      })

      if (result.success) {
        SuccessToast(t.inviteSent)
        setEmail("")
        setRole("STAFF")
        setName("")
        onOpenChange(false)
        onSuccess()
      } else {
        ErrorToast(t.failedToInvite)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.inviteMember}</DialogTitle>
          <DialogDescription>{t.inviteDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">
              {t.email} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="invite-email"
              type="email"
              dir="ltr"
              className="text-start"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-name">{t.name}</Label>
            <Input
              id="invite-name"
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.role}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectRole} />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {roleLabel(t, opt)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !email}>
            {isPending ? t.processing : t.sendInvite}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
