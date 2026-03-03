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

const ROLE_OPTIONS = [
  { value: "STAFF", label: "Staff", description: "General staff member" },
  { value: "TEACHER", label: "Teacher", description: "Teaching faculty" },
  { value: "ADMIN", label: "Admin", description: "School administrator" },
  {
    value: "ACCOUNTANT",
    label: "Accountant",
    description: "Financial management",
  },
  { value: "STUDENT", label: "Student", description: "Enrolled student" },
  {
    value: "GUARDIAN",
    label: "Guardian",
    description: "Parent or guardian",
  },
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
        SuccessToast(t.inviteSent || "Invitation sent")
        setEmail("")
        setRole("STAFF")
        setName("")
        onOpenChange(false)
        onSuccess()
      } else {
        ErrorToast(result.error || t.failedToInvite || "Failed to send invite")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.inviteMember || "Invite Member"}</DialogTitle>
          <DialogDescription>
            {t.inviteDescription ||
              "Send an invitation to join this school portal."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">
              {t.email || "Email"} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="invite-email"
              type="email"
              placeholder={t.emailPlaceholder || "Email address"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-name">{t.name || "Name"}</Label>
            <Input
              id="invite-name"
              placeholder={t.namePlaceholder || "Full name (optional)"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.role || "Role"}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectRole || "Select role"} />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel || "Cancel"}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !email}>
            {isPending
              ? t.processing || "Processing..."
              : t.sendInvite || "Send Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
