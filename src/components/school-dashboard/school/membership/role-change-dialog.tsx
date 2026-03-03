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

interface RoleChangeDialogProps {
  member: MemberRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  t: Record<string, string>
}

const AVAILABLE_ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "TEACHER", label: "Teacher" },
  { value: "STUDENT", label: "Student" },
  { value: "GUARDIAN", label: "Guardian" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "STAFF", label: "Staff" },
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
        SuccessToast(t.roleChanged || "Role changed")
        onOpenChange(false)
        setSelectedRole("")
        setDateOfBirth("")
        setGender("")
        onSuccess()
      } else {
        ErrorToast(
          result.error || t.failedToChangeRole || "Failed to change role"
        )
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.changeRole || "Change Role"}</DialogTitle>
          <DialogDescription>
            {t.changeRoleDescription ||
              `Change role for ${member?.name || "member"}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t.currentRole || "Current Role"}</Label>
            <Badge variant="outline">{member?.role}</Badge>
          </div>

          <div className="space-y-2">
            <Label>{t.newRole || "New Role"}</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectRole || "Select role"} />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ROLES.filter((r) => r.value !== member?.role).map(
                  (role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {needsStudentFields && (
            <>
              <div className="space-y-2">
                <Label>{t.dateOfBirth || "Date of Birth"}</Label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.gender || "Gender"}</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t.selectGender || "Select gender"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t.male || "Male"}</SelectItem>
                    <SelectItem value="female">
                      {t.female || "Female"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel || "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isPending ||
              !selectedRole ||
              (needsStudentFields && (!dateOfBirth || !gender))
            }
          >
            {isPending ? t.saving || "Saving..." : t.confirm || "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
