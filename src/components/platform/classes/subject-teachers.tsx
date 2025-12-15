"use client"

import * as React from "react"
import { useTransition, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Label } from "@/components/ui/label"
import { UserPlus, Trash2, Loader2, Users, Mail, Shield } from "lucide-react"
import { SuccessToast, ErrorToast } from "@/components/atom/toast"
import {
  assignSubjectTeacher,
  removeSubjectTeacher,
  getClassSubjectTeachers,
  getAvailableTeachersForClass,
  type ClassTeacherRow,
} from "./actions"
import { classTeacherRoles, type ClassTeacherRole } from "./validation"
import type { Locale } from "@/components/internationalization/config"

interface SubjectTeachersProps {
  classId: string
  lang?: Locale
  initialTeachers?: ClassTeacherRow[]
}

export function SubjectTeachers({
  classId,
  lang = "en",
  initialTeachers = [],
}: SubjectTeachersProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [teachers, setTeachers] = useState<ClassTeacherRow[]>(initialTeachers)
  const [availableTeachers, setAvailableTeachers] = useState<
    Array<{ id: string; name: string; email: string | null }>
  >([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedTeacherId, setSelectedTeacherId] = useState("")
  const [selectedRole, setSelectedRole] = useState<ClassTeacherRole>("ASSISTANT")
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false)

  const isRTL = lang === "ar"

  const t = {
    title: isRTL ? "معلمو المادة" : "Subject Teachers",
    description: isRTL
      ? "المعلمون المعينون لهذا الفصل"
      : "Teachers assigned to this class",
    addTeacher: isRTL ? "إضافة معلم" : "Add Teacher",
    noTeachers: isRTL
      ? "لم يتم تعيين معلمين بعد"
      : "No teachers assigned yet",
    selectTeacher: isRTL ? "اختر معلماً" : "Select a teacher",
    selectRole: isRTL ? "اختر الدور" : "Select role",
    role: isRTL ? "الدور" : "Role",
    teacher: isRTL ? "المعلم" : "Teacher",
    cancel: isRTL ? "إلغاء" : "Cancel",
    assign: isRTL ? "تعيين" : "Assign",
    assigning: isRTL ? "جاري التعيين..." : "Assigning...",
    remove: isRTL ? "إزالة" : "Remove",
    removing: isRTL ? "جاري الإزالة..." : "Removing...",
    confirmRemove: isRTL ? "تأكيد الإزالة" : "Confirm Removal",
    confirmRemoveDescription: isRTL
      ? "هل أنت متأكد من إزالة هذا المعلم من الفصل؟"
      : "Are you sure you want to remove this teacher from the class?",
    assignSuccess: isRTL ? "تم تعيين المعلم بنجاح" : "Teacher assigned successfully",
    removeSuccess: isRTL ? "تم إزالة المعلم بنجاح" : "Teacher removed successfully",
    noAvailableTeachers: isRTL
      ? "لا يوجد معلمون متاحون"
      : "No available teachers",
    roles: {
      PRIMARY: isRTL ? "أساسي" : "Primary",
      CO_TEACHER: isRTL ? "معلم مساعد" : "Co-Teacher",
      ASSISTANT: isRTL ? "مساعد" : "Assistant",
    } as Record<ClassTeacherRole, string>,
  }

  // Load teachers on mount if not provided
  useEffect(() => {
    if (initialTeachers.length === 0) {
      loadTeachers()
    }
  }, [classId])

  const loadTeachers = async () => {
    startTransition(async () => {
      const result = await getClassSubjectTeachers({ classId })
      if (result.success) {
        setTeachers(result.data)
      }
    })
  }

  const loadAvailableTeachers = async () => {
    setIsLoadingTeachers(true)
    const result = await getAvailableTeachersForClass({ classId })
    if (result.success) {
      setAvailableTeachers(result.data)
    }
    setIsLoadingTeachers(false)
  }

  const handleOpenAddDialog = () => {
    loadAvailableTeachers()
    setSelectedTeacherId("")
    setSelectedRole("ASSISTANT")
    setIsAddDialogOpen(true)
  }

  const handleAssign = async () => {
    if (!selectedTeacherId) return

    startTransition(async () => {
      const result = await assignSubjectTeacher({
        classId,
        teacherId: selectedTeacherId,
        role: selectedRole,
      })

      if (result.success) {
        SuccessToast(t.assignSuccess)
        setIsAddDialogOpen(false)
        loadTeachers()
        router.refresh()
      } else {
        ErrorToast(result.error)
      }
    })
  }

  const handleRemove = async (id: string) => {
    startTransition(async () => {
      const result = await removeSubjectTeacher({ id })

      if (result.success) {
        SuccessToast(t.removeSuccess)
        loadTeachers()
        router.refresh()
      } else {
        ErrorToast(result.error)
      }
    })
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "PRIMARY":
        return "default"
      case "CO_TEACHER":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAddDialog} size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              {t.addTeacher}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.addTeacher}</DialogTitle>
              <DialogDescription>
                {t.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t.teacher}</Label>
                {isLoadingTeachers ? (
                  <Skeleton className="h-10 w-full" />
                ) : availableTeachers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.noAvailableTeachers}</p>
                ) : (
                  <Select
                    value={selectedTeacherId}
                    onValueChange={setSelectedTeacherId}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectTeacher} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          <div className="flex flex-col">
                            <span>{teacher.name}</span>
                            {teacher.email && (
                              <span className="text-xs text-muted-foreground">
                                {teacher.email}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t.role}</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(v) => setSelectedRole(v as ClassTeacherRole)}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectRole} />
                  </SelectTrigger>
                  <SelectContent>
                    {classTeacherRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {t.roles[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isPending}
              >
                {t.cancel}
              </Button>
              <Button
                onClick={handleAssign}
                disabled={isPending || !selectedTeacherId}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.assigning}
                  </>
                ) : (
                  t.assign
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {teachers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t.noTeachers}
          </p>
        ) : (
          <div className="space-y-4">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {teacher.teacherName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{teacher.teacherName}</p>
                      <Badge variant={getRoleBadgeVariant(teacher.role)}>
                        <Shield className="mr-1 h-3 w-3" />
                        {t.roles[teacher.role as ClassTeacherRole] || teacher.role}
                      </Badge>
                    </div>
                    {teacher.teacherEmail && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {teacher.teacherEmail}
                      </p>
                    )}
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t.confirmRemove}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t.confirmRemoveDescription}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleRemove(teacher.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t.removing}
                          </>
                        ) : (
                          t.remove
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function SubjectTeachersLoading() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-28" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
