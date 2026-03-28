"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import {
  Briefcase,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
  User,
} from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"
import {
  createGuardianAndLink,
  unlinkGuardian,
  updateGuardianLink,
} from "@/components/school-dashboard/listings/parents/actions"

import type { Student } from "../../registration/types"

interface GuardianTabProps {
  student: Student
  dictionary?: any
}

export function GuardianTab({ student, dictionary }: GuardianTabProps) {
  const d = dictionary
  const [isPending, startTransition] = useTransition()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedGuardian, setSelectedGuardian] = useState<any>(null)

  const GUARDIAN_TYPES = [
    { value: "father", label: d?.father || "Father" },
    { value: "mother", label: d?.mother || "Mother" },
    { value: "guardian", label: d?.guardian || "Guardian" },
    { value: "other", label: d?.other || "Other" },
  ]

  // Form state for adding guardian
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    emailAddress: "",
    phoneNumber: "",
    guardianType: "",
    isPrimary: false,
    occupation: "",
    workplace: "",
    notes: "",
  })

  const guardians = student.studentGuardians || []

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
  }

  const getPhoneIcon = (type: string) => {
    switch (type) {
      case "mobile":
        return "📱"
      case "home":
        return "🏠"
      case "work":
        return "💼"
      case "emergency":
        return "🚨"
      default:
        return "📞"
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      emailAddress: "",
      phoneNumber: "",
      guardianType: "",
      isPrimary: false,
      occupation: "",
      workplace: "",
      notes: "",
    })
  }

  const handleAddGuardian = () => {
    startTransition(async () => {
      const result = await createGuardianAndLink({
        studentId: student.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        emailAddress: formData.emailAddress || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        guardianType: formData.guardianType,
        isPrimary: formData.isPrimary,
        occupation: formData.occupation || undefined,
        workplace: formData.workplace || undefined,
        notes: formData.notes || undefined,
      })

      if (result.success) {
        toast.success(d?.guardianAdded || "Guardian added successfully")
        setIsAddOpen(false)
        resetForm()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleEditGuardian = () => {
    if (!selectedGuardian) return

    startTransition(async () => {
      const result = await updateGuardianLink({
        studentGuardianId: selectedGuardian.id,
        isPrimary: formData.isPrimary,
        occupation: formData.occupation || undefined,
        workplace: formData.workplace || undefined,
        notes: formData.notes || undefined,
      })

      if (result.success) {
        toast.success(d?.guardianUpdated || "Guardian updated successfully")
        setIsEditOpen(false)
        setSelectedGuardian(null)
        resetForm()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleDeleteGuardian = () => {
    if (!selectedGuardian) return

    startTransition(async () => {
      const result = await unlinkGuardian({
        studentGuardianId: selectedGuardian.id,
      })

      if (result.success) {
        toast.success(d?.guardianRemoved || "Guardian removed successfully")
        setIsDeleteOpen(false)
        setSelectedGuardian(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  const openEditDialog = (guardianRel: any) => {
    setSelectedGuardian(guardianRel)
    setFormData({
      firstName: guardianRel.guardian.firstName || "",
      lastName: guardianRel.guardian.lastName || "",
      emailAddress: guardianRel.guardian.emailAddress || "",
      phoneNumber: guardianRel.guardian.phoneNumbers?.[0]?.phoneNumber || "",
      guardianType: guardianRel.guardianType?.name || "",
      isPrimary: guardianRel.isPrimary || false,
      occupation: guardianRel.occupation || "",
      workplace: guardianRel.workplace || "",
      notes: guardianRel.notes || "",
    })
    setIsEditOpen(true)
  }

  const openDeleteDialog = (guardianRel: any) => {
    setSelectedGuardian(guardianRel)
    setIsDeleteOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Add Guardian Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="me-2 h-4 w-4" />
          {d?.addGuardian || "Add Guardian"}
        </Button>
      </div>

      {guardians.map((guardianRel: any, index: number) => {
        const guardian = guardianRel.guardian
        const guardianType =
          guardianRel.guardianType?.name || guardianRel.relation
        const fullName = `${guardian.firstName} ${guardian.lastName}`

        return (
          <Card
            key={guardianRel.id || index}
            className={guardianRel.isPrimary ? "border-primary" : ""}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={guardian.profileUrl} alt={fullName} />
                    <AvatarFallback>
                      {getInitials(guardian.firstName, guardian.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {fullName}
                      {guardianRel.isPrimary && (
                        <Badge variant="default" className="text-xs">
                          {d?.primary || "Primary"}
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="text-muted-foreground mt-1 flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {guardianType}
                      </span>
                      {guardianRel.occupation && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {guardianRel.occupation}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(guardianRel)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => openDeleteDialog(guardianRel)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Contact Information */}
              <div className="space-y-2">
                <h4 className="font-medium">
                  {d?.contactInformation || "Contact Information"}
                </h4>
                <div className="grid gap-2">
                  {guardian.emailAddress && (
                    <a
                      href={`mailto:${guardian.emailAddress}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      {guardian.emailAddress}
                    </a>
                  )}
                  {guardian.phoneNumbers?.map(
                    (phone: any, phoneIndex: number) => (
                      <div
                        key={phoneIndex}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Phone className="text-muted-foreground h-4 w-4" />
                        <a
                          href={`tel:${phone.phoneNumber}`}
                          className="text-blue-600 hover:underline"
                        >
                          {phone.phoneNumber}
                        </a>
                        <span className="text-muted-foreground">
                          {getPhoneIcon(phone.phoneType)} {phone.phoneType}
                        </span>
                        {phone.isPrimary && (
                          <Badge variant="secondary" className="text-xs">
                            {d?.primary || "Primary"}
                          </Badge>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Work Information */}
              {guardianRel.workplace && (
                <div className="space-y-2">
                  <h4 className="font-medium">
                    {d?.workInformation || "Work Information"}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {guardianRel.occupation} {d?.at || "at"}{" "}
                    {guardianRel.workplace}
                  </p>
                </div>
              )}

              {/* Address if different from student */}
              {guardian.address && (
                <div className="space-y-2">
                  <h4 className="font-medium">{d?.address || "Address"}</h4>
                  <p className="text-muted-foreground text-sm">
                    {guardian.address}
                  </p>
                </div>
              )}

              {/* Permissions & Access */}
              <div className="space-y-2">
                <h4 className="font-medium">
                  {d?.permissions || "Permissions"}
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {d?.canPickUp || "Can Pick Up"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {d?.receivesReports || "Receives Reports"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {d?.emergencyContact || "Emergency Contact"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {d?.feePayment || "Fee Payment"}
                  </Badge>
                </div>
              </div>

              {/* Notes */}
              {guardianRel.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium">{d?.notes || "Notes"}</h4>
                  <p className="text-muted-foreground text-sm">
                    {guardianRel.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {guardians.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <User className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground">
              {d?.noGuardiansRegistered || "No guardians registered"}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="me-2 h-4 w-4" />
              {d?.addGuardian || "Add Guardian"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Guardian Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{d?.addGuardian || "Add Guardian"}</DialogTitle>
            <DialogDescription>
              {d?.addGuardianDescription ||
                "Add a parent or guardian for this student."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  {d?.firstName || "First Name"} *
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder={d?.enterFirstName || "Enter first name"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{d?.lastName || "Last Name"} *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder={d?.enterLastName || "Enter last name"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianType">
                {d?.relationship || "Relationship"} *
              </Label>
              <Select
                value={formData.guardianType}
                onValueChange={(value) =>
                  setFormData({ ...formData, guardianType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={d?.selectRelationship || "Select relationship"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {GUARDIAN_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailAddress">{d?.email || "Email"}</Label>
              <Input
                id="emailAddress"
                type="email"
                value={formData.emailAddress}
                onChange={(e) =>
                  setFormData({ ...formData, emailAddress: e.target.value })
                }
                placeholder={d?.emailPlaceholder || "guardian@email.com"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">
                {d?.phoneNumber || "Phone Number"}
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder={d?.phonePlaceholder || "+1 234 567 8900"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="occupation">
                  {d?.occupation || "Occupation"}
                </Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) =>
                    setFormData({ ...formData, occupation: e.target.value })
                  }
                  placeholder={d?.occupationPlaceholder || "e.g., Engineer"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workplace">{d?.workplace || "Workplace"}</Label>
                <Input
                  id="workplace"
                  value={formData.workplace}
                  onChange={(e) =>
                    setFormData({ ...formData, workplace: e.target.value })
                  }
                  placeholder={d?.workplacePlaceholder || "e.g., Tech Corp"}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isPrimary"
                checked={formData.isPrimary}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPrimary: !!checked })
                }
              />
              <Label htmlFor="isPrimary" className="text-sm font-normal">
                {d?.setAsPrimaryGuardian || "Set as primary guardian"}
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{d?.notes || "Notes"}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder={d?.additionalNotes || "Additional notes..."}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddOpen(false)
                resetForm()
              }}
            >
              {d?.cancel || "Cancel"}
            </Button>
            <Button
              onClick={handleAddGuardian}
              disabled={
                isPending ||
                !formData.firstName ||
                !formData.lastName ||
                !formData.guardianType
              }
            >
              {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {d?.addGuardian || "Add Guardian"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Guardian Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{d?.editGuardian || "Edit Guardian"}</DialogTitle>
            <DialogDescription>
              {d?.editGuardianDescription ||
                "Update guardian relationship details."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-3">
              <p className="font-medium">
                {formData.firstName} {formData.lastName}
              </p>
              <p className="text-muted-foreground text-sm">
                {formData.emailAddress || d?.noEmail || "No email"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editOccupation">
                  {d?.occupation || "Occupation"}
                </Label>
                <Input
                  id="editOccupation"
                  value={formData.occupation}
                  onChange={(e) =>
                    setFormData({ ...formData, occupation: e.target.value })
                  }
                  placeholder={d?.occupationPlaceholder || "e.g., Engineer"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editWorkplace">
                  {d?.workplace || "Workplace"}
                </Label>
                <Input
                  id="editWorkplace"
                  value={formData.workplace}
                  onChange={(e) =>
                    setFormData({ ...formData, workplace: e.target.value })
                  }
                  placeholder={d?.workplacePlaceholder || "e.g., Tech Corp"}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="editIsPrimary"
                checked={formData.isPrimary}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPrimary: !!checked })
                }
              />
              <Label htmlFor="editIsPrimary" className="text-sm font-normal">
                {d?.setAsPrimaryGuardian || "Set as primary guardian"}
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editNotes">{d?.notes || "Notes"}</Label>
              <Textarea
                id="editNotes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder={d?.additionalNotes || "Additional notes..."}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false)
                setSelectedGuardian(null)
                resetForm()
              }}
            >
              {d?.cancel || "Cancel"}
            </Button>
            <Button onClick={handleEditGuardian} disabled={isPending}>
              {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {d?.saveChanges || "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {d?.removeGuardian || "Remove Guardian"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {d?.removeGuardianConfirmation ||
                "Are you sure you want to remove"}{" "}
              <strong>
                {selectedGuardian?.guardian?.firstName}{" "}
                {selectedGuardian?.guardian?.lastName}
              </strong>{" "}
              {d?.asGuardianForStudent ||
                "as a guardian for this student? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedGuardian(null)}>
              {d?.cancel || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGuardian}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {d?.remove || "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
