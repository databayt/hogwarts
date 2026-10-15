"use client"

import { useState, useTransition } from "react"

import { Badge } from "@/components/ui/badge"
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

import { changeRole } from "./actions"
import type { MemberRow } from "./columns"
import { roleLabel } from "./labels"

interface RoleChangeDialogProps {
  member: MemberRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  t: Record<string, string>
}

const AVAILABLE_ROLES = [
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "ACCOUNTANT",
  "STAFF",
] as const

export function RoleChangeDialog({
  member,
  open,
  onOpenChange,
  onSuccess,
  t,
}: RoleChangeDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [gender, setGender] = useState<string>("")

  const needsStudentFields =
    selectedRole === "STUDENT" &&
    member?.role !== "STUDENT" &&
    !member?.studentId

  const handleSubmit = () => {
    if (!member || !selectedRole) return

    startTransition(async () => {
      const result = await changeRole({
        userId: member.id,
        newRole: selectedRole as
          | "ADMIN"
          | "TEACHER"
          | "STUDENT"
          | "GUARDIAN"
          | "ACCOUNTANT"
          | "STAFF",
        dateOfBirth: needsStudentFields ? dateOfBirth : undefined,
        gender: needsStudentFields ? (gender as "male" | "female") : undefined,
      })

      if (result.success) {
        SuccessToast(t.roleChanged)
        onOpenChange(false)
        setSelectedRole("")
        setDateOfBirth("")
        setGender("")
        onSuccess()
      } else {
        ErrorToast(t.failedToChangeRole)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.changeRole}</DialogTitle>
          <DialogDescription>{t.changeRoleDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t.currentRole}</Label>
            <Badge variant="outline">{roleLabel(t, member?.role)}</Badge>
          </div>

          <div className="space-y-2">
            <Label>{t.newRole}</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectRole} />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ROLES.filter((r) => r !== member?.role).map(
                  (role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabel(t, role)}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {needsStudentFields && (
            <>
              <div className="space-y-2">
                <Label>{t.dateOfBirth}</Label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.gender}</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectGender} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t.male}</SelectItem>
                    <SelectItem value="female">{t.female}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isPending ||
              !selectedRole ||
              (needsStudentFields && (!dateOfBirth || !gender))
            }
          >
            {isPending ? t.saving : t.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
