"use client"

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
} from "@/components/platform/parents/actions"

import type { Student } from "../../registration/types"

interface GuardianTabProps {
  student: Student
}

const GUARDIAN_TYPES = [
  { value: "father", label: "Father", labelAr: "الأب" },
  { value: "mother", label: "Mother", labelAr: "الأم" },
  { value: "guardian", label: "Guardian", labelAr: "ولي الأمر" },
  { value: "other", label: "Other", labelAr: "آخر" },
]

export function GuardianTab({ student }: GuardianTabProps) {
  const [isPending, startTransition] = useTransition()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedGuardian, setSelectedGuardian] = useState<any>(null)

  // Form state for adding guardian
  const [formData, setFormData] = useState({
    givenName: "",
    surname: "",
    emailAddress: "",
    phoneNumber: "",
    guardianType: "",
    isPrimary: false,
    occupation: "",
    workplace: "",
    notes: "",
  })

  const guardians = student.studentGuardians || []

  const getInitials = (givenName: string, surname: string) => {
    return `${givenName?.[0] || ""}${surname?.[0] || ""}`.toUpperCase()
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
      givenName: "",
      surname: "",
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
        givenName: formData.givenName,
        surname: formData.surname,
        emailAddress: formData.emailAddress || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        guardianType: formData.guardianType,
        isPrimary: formData.isPrimary,
        occupation: formData.occupation || undefined,
        workplace: formData.workplace || undefined,
        notes: formData.notes || undefined,
      })

      if (result.success) {
        toast.success("Guardian added successfully")
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
        toast.success("Guardian updated successfully")
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
        toast.success("Guardian removed successfully")
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
      givenName: guardianRel.guardian.givenName || "",
      surname: guardianRel.guardian.surname || "",
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
          <Plus className="mr-2 h-4 w-4" />
          Add Guardian
        </Button>
      </div>

      {guardians.map((guardianRel: any, index: number) => {
        const guardian = guardianRel.guardian
        const guardianType =
          guardianRel.guardianType?.name || guardianRel.relation
        const fullName = `${guardian.givenName} ${guardian.surname}`

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
                      {getInitials(guardian.givenName, guardian.surname)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {fullName}
                      {guardianRel.isPrimary && (
                        <Badge variant="default" className="text-xs">
                          Primary
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
                <h4 className="font-medium">Contact Information</h4>
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
                            Primary
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
                  <h4 className="font-medium">Work Information</h4>
                  <p className="text-muted-foreground text-sm">
                    {guardianRel.occupation} at {guardianRel.workplace}
                  </p>
                </div>
              )}

              {/* Address if different from student */}
              {guardian.address && (
                <div className="space-y-2">
                  <h4 className="font-medium">Address</h4>
                  <p className="text-muted-foreground text-sm">
                    {guardian.address}
                  </p>
                </div>
              )}

              {/* Permissions & Access */}
              <div className="space-y-2">
                <h4 className="font-medium">Permissions</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    Can Pick Up
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Receives Reports
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Emergency Contact
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Fee Payment
                  </Badge>
                </div>
              </div>

              {/* Notes */}
              {guardianRel.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium">Notes</h4>
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
            <p className="text-muted-foreground">No guardians registered</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Guardian
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Guardian Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Guardian</DialogTitle>
            <DialogDescription>
              Add a parent or guardian for this student.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="givenName">First Name *</Label>
                <Input
                  id="givenName"
                  value={formData.givenName}
                  onChange={(e) =>
                    setFormData({ ...formData, givenName: e.target.value })
                  }
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Last Name *</Label>
                <Input
                  id="surname"
                  value={formData.surname}
                  onChange={(e) =>
                    setFormData({ ...formData, surname: e.target.value })
                  }
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianType">Relationship *</Label>
              <Select
                value={formData.guardianType}
                onValueChange={(value) =>
                  setFormData({ ...formData, guardianType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
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
              <Label htmlFor="emailAddress">Email</Label>
              <Input
                id="emailAddress"
                type="email"
                value={formData.emailAddress}
                onChange={(e) =>
                  setFormData({ ...formData, emailAddress: e.target.value })
                }
                placeholder="guardian@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder="+1 234 567 8900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) =>
                    setFormData({ ...formData, occupation: e.target.value })
                  }
                  placeholder="e.g., Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workplace">Workplace</Label>
                <Input
                  id="workplace"
                  value={formData.workplace}
                  onChange={(e) =>
                    setFormData({ ...formData, workplace: e.target.value })
                  }
                  placeholder="e.g., Tech Corp"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrimary"
                checked={formData.isPrimary}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPrimary: !!checked })
                }
              />
              <Label htmlFor="isPrimary" className="text-sm font-normal">
                Set as primary guardian
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes..."
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
              Cancel
            </Button>
            <Button
              onClick={handleAddGuardian}
              disabled={
                isPending ||
                !formData.givenName ||
                !formData.surname ||
                !formData.guardianType
              }
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Guardian
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Guardian Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Guardian</DialogTitle>
            <DialogDescription>
              Update guardian relationship details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-3">
              <p className="font-medium">
                {formData.givenName} {formData.surname}
              </p>
              <p className="text-muted-foreground text-sm">
                {formData.emailAddress || "No email"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editOccupation">Occupation</Label>
                <Input
                  id="editOccupation"
                  value={formData.occupation}
                  onChange={(e) =>
                    setFormData({ ...formData, occupation: e.target.value })
                  }
                  placeholder="e.g., Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editWorkplace">Workplace</Label>
                <Input
                  id="editWorkplace"
                  value={formData.workplace}
                  onChange={(e) =>
                    setFormData({ ...formData, workplace: e.target.value })
                  }
                  placeholder="e.g., Tech Corp"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="editIsPrimary"
                checked={formData.isPrimary}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPrimary: !!checked })
                }
              />
              <Label htmlFor="editIsPrimary" className="text-sm font-normal">
                Set as primary guardian
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea
                id="editNotes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes..."
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
              Cancel
            </Button>
            <Button onClick={handleEditGuardian} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Guardian</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>
                {selectedGuardian?.guardian?.givenName}{" "}
                {selectedGuardian?.guardian?.surname}
              </strong>{" "}
              as a guardian for this student? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedGuardian(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGuardian}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
