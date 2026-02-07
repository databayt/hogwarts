/**
 * Department Management Content
 *
 * Manages school organizational structure with departments, teachers, and subjects:
 * - CRUD operations for departments with bilingual naming (English + Arabic)
 * - Shows associated teachers (with primary/secondary designations) and subjects
 * - Expandable cards reveal full teacher and subject lists
 * - Real-time stats: total departments, unique teacher count, unique subject count
 *
 * Client component for:
 * - Modal dialogs (create/edit/delete) with form state management
 * - Optimistic UI updates (loading states, disabled buttons during submission)
 * - Expansion/collapse state for detailed views
 * - Search filtering across both English and Arabic names
 *
 * Multi-tenant: All data scoped by schoolId via server actions
 * Async operations use useTransition for progressive submission without full page refresh
 */
"use client"

import { useEffect, useState, useTransition } from "react"
import {
  AlertCircle,
  BookOpen,
  Building,
  ChevronRight,
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "./actions"

// ============================================================================
// Types
// ============================================================================

interface Teacher {
  id: string
  givenName: string
  surname: string
  emailAddress: string
  profilePhotoUrl?: string | null
  isPrimary: boolean
}

interface Subject {
  id: string
  subjectName: string
  lang?: string
}

interface Department {
  id: string
  departmentName: string
  lang?: string
  teachers: Teacher[]
  subjects: Subject[]
}

interface Props {
  dictionary?: Dictionary["school"]
  lang: Locale
}

// ============================================================================
// Helper Functions
// ============================================================================

function getInitials(givenName: string, surname: string): string {
  return `${givenName.charAt(0)}${surname.charAt(0)}`.toUpperCase()
}

// ============================================================================
// Component
// ============================================================================

export function DepartmentsContent({ dictionary, lang }: Props) {
  // Data states
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI states
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null
  )
  const [newDepartmentName, setNewDepartmentName] = useState("")
  const [newDepartmentLang, setNewDepartmentLang] = useState("")
  const [expandedDepartment, setExpandedDepartment] = useState<string | null>(
    null
  )

  // Delete confirmation state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    id: string
    name: string
  }>({ open: false, id: "", name: "" })

  // Action states
  const [isPending, startTransition] = useTransition()

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getDepartments(lang)
      if (result.success && result.data?.departments) {
        setDepartments(result.data.departments as unknown as Department[])
      } else if (!result.success) {
        setError(result.message || "Failed to load departments")
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load departments"
      console.error("Failed to fetch departments:", err)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const t = {
    title: lang === "ar" ? "إدارة الأقسام" : "Department Management",
    subtitle:
      lang === "ar"
        ? "إدارة أقسام المدرسة وتعيين المعلمين"
        : "Manage school departments and teacher assignments",
    search: lang === "ar" ? "البحث في الأقسام..." : "Search departments...",
    addDepartment: lang === "ar" ? "إضافة قسم" : "Add Department",
    editDepartment: lang === "ar" ? "تعديل القسم" : "Edit Department",
    deleteDepartment: lang === "ar" ? "حذف القسم" : "Delete Department",
    department: lang === "ar" ? "القسم" : "Department",
    departmentName: lang === "ar" ? "اسم القسم" : "Department Name",
    language: lang === "ar" ? "اللغة" : "Language",
    teachers: lang === "ar" ? "المعلمون" : "Teachers",
    subjects: lang === "ar" ? "المواد" : "Subjects",
    actions: lang === "ar" ? "إجراءات" : "Actions",
    save: lang === "ar" ? "حفظ" : "Save",
    cancel: lang === "ar" ? "إلغاء" : "Cancel",
    primary: lang === "ar" ? "أساسي" : "Primary",
    noDepartments: lang === "ar" ? "لا توجد أقسام" : "No departments found",
    noTeachers: lang === "ar" ? "لا يوجد معلمون" : "No teachers assigned",
    noSubjects: lang === "ar" ? "لا توجد مواد" : "No subjects assigned",
    totalDepartments: lang === "ar" ? "إجمالي الأقسام" : "Total Departments",
    totalTeachers: lang === "ar" ? "إجمالي المعلمين" : "Total Teachers",
    totalSubjects: lang === "ar" ? "إجمالي المواد" : "Total Subjects",
    viewDetails: lang === "ar" ? "عرض التفاصيل" : "View Details",
  }

  // Filter departments
  const filteredDepartments = departments.filter((dept) => {
    const name = dept.departmentName
    return name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Calculate aggregated stats across all departments
  // Uses Set deduplication because a teacher/subject can belong to multiple departments
  const stats = {
    totalDepartments: departments.length,
    // Deduplicate teachers across all departments (a teacher may have multiple roles)
    totalTeachers: new Set(
      departments.flatMap((d) => d.teachers.map((t) => t.id))
    ).size,
    // Deduplicate subjects across all departments (a subject may be taught across multiple depts)
    totalSubjects: new Set(
      departments.flatMap((d) => d.subjects.map((s) => s.id))
    ).size,
  }

  const handleCreateDepartment = async () => {
    if (!newDepartmentName) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append("departmentName", newDepartmentName)
      if (newDepartmentLang) {
        formData.append("lang", newDepartmentLang || "ar")
      }

      const result = await createDepartment(formData)
      if (result.success) {
        toast.success(result.message || "Department created successfully")
        setNewDepartmentName("")
        setNewDepartmentLang("")
        setIsCreateDialogOpen(false)
        fetchDepartments()
      } else {
        toast.error(result.message || "Failed to create department")
      }
    })
  }

  const handleUpdateDepartment = async () => {
    if (!editingDepartment || !newDepartmentName) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append("id", editingDepartment.id)
      formData.append("departmentName", newDepartmentName)
      formData.append("lang", newDepartmentLang || "ar")

      const result = await updateDepartment(formData)
      if (result.success) {
        toast.success(result.message || "Department updated successfully")
        setEditingDepartment(null)
        setNewDepartmentName("")
        setNewDepartmentLang("")
        fetchDepartments()
      } else {
        toast.error(result.message || "Failed to update department")
      }
    })
  }

  const handleDeleteDepartment = async () => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("id", deleteDialog.id)

      const result = await deleteDepartment(formData)
      if (result.success) {
        toast.success(result.message || "Department deleted successfully")
        fetchDepartments()
      } else {
        toast.error(result.message || "Failed to delete department")
      }
      setDeleteDialog({ ...deleteDialog, open: false })
    })
  }

  const openEditDialog = (dept: Department) => {
    setEditingDepartment(dept)
    setNewDepartmentName(dept.departmentName)
    setNewDepartmentLang(dept.lang || "ar")
  }

  const openDeleteDialog = (dept: Department) => {
    const name = dept.departmentName
    setDeleteDialog({ open: true, id: dept.id, name })
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading departments">
        {/* Header skeleton */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* List skeleton */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <span className="sr-only">Loading departments...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error State with Retry */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDepartments}
              className="ms-4"
            >
              <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
              {lang === "ar" ? "إعادة المحاولة" : "Retry"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t.addDepartment}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.addDepartment}</DialogTitle>
              <DialogDescription>
                {lang === "ar"
                  ? "أضف قسم جديد للمدرسة"
                  : "Add a new department to the school"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.departmentName}</Label>
                <Input
                  id="name"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder={
                    lang === "ar"
                      ? "مثال: قسم العلوم"
                      : "e.g., Science Department"
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lang">{t.language}</Label>
                <select
                  id="lang"
                  value={newDepartmentLang}
                  onChange={(e) => setNewDepartmentLang(e.target.value)}
                  className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="ar">
                    {lang === "ar" ? "عربي" : "Arabic"}
                  </option>
                  <option value="en">
                    {lang === "ar" ? "إنجليزي" : "English"}
                  </option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isPending}
              >
                {t.cancel}
              </Button>
              <Button
                onClick={handleCreateDepartment}
                disabled={!newDepartmentName || isPending}
              >
                {isPending && (
                  <Loader2
                    className="me-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                {t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  {t.totalDepartments}
                </p>
                <p className="text-2xl font-bold">{stats.totalDepartments}</p>
              </div>
              <Building className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  {t.totalTeachers}
                </p>
                <p className="text-2xl font-bold">{stats.totalTeachers}</p>
              </div>
              <Users className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  {t.totalSubjects}
                </p>
                <p className="text-2xl font-bold">{stats.totalSubjects}</p>
              </div>
              <BookOpen className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Departments Grid */}
      {filteredDepartments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredDepartments.map((dept) => (
            <Card key={dept.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-lg p-2">
                      <Building className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {dept.departmentName}
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(dept)}
                      aria-label={`${t.editDepartment} ${dept.departmentName}`}
                    >
                      <Edit className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8"
                      onClick={() => openDeleteDialog(dept)}
                      aria-label={`${t.deleteDepartment} ${dept.departmentName}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="text-muted-foreground h-4 w-4" />
                    <span>
                      {dept.teachers.length} {t.teachers}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="text-muted-foreground h-4 w-4" />
                    <span>
                      {dept.subjects.length} {t.subjects}
                    </span>
                  </div>
                </div>

                {/* Teachers Preview */}
                {dept.teachers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t.teachers}</p>
                    <div className="flex -space-x-2 rtl:space-x-reverse">
                      {dept.teachers.slice(0, 5).map((teacher) => (
                        <Avatar
                          key={teacher.id}
                          className="border-background h-8 w-8 border-2"
                        >
                          <AvatarImage
                            src={teacher.profilePhotoUrl || undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(teacher.givenName, teacher.surname)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {dept.teachers.length > 5 && (
                        <div className="bg-muted border-background flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium">
                          +{dept.teachers.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Subjects Preview */}
                {dept.subjects.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t.subjects}</p>
                    <div className="flex flex-wrap gap-1">
                      {dept.subjects.slice(0, 4).map((subject) => (
                        <Badge
                          key={subject.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {lang === "ar"
                            ? subject.subjectName
                            : subject.subjectName}
                        </Badge>
                      ))}
                      {dept.subjects.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{dept.subjects.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Expand/Collapse */}
                <Button
                  variant="ghost"
                  className="w-full justify-between"
                  onClick={() =>
                    setExpandedDepartment(
                      expandedDepartment === dept.id ? null : dept.id
                    )
                  }
                >
                  {t.viewDetails}
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${expandedDepartment === dept.id ? "rotate-90" : ""}`}
                  />
                </Button>

                {/* Expanded Content */}
                {expandedDepartment === dept.id && (
                  <div className="space-y-4 border-t pt-2">
                    {/* Teachers Table */}
                    {dept.teachers.length > 0 ? (
                      <div>
                        <p className="mb-2 text-sm font-medium">{t.teachers}</p>
                        <div className="space-y-2">
                          {dept.teachers.map((teacher) => (
                            <div
                              key={teacher.id}
                              className="bg-muted/50 flex items-center gap-3 rounded-lg p-2"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={teacher.profilePhotoUrl || undefined}
                                />
                                <AvatarFallback className="text-xs">
                                  {getInitials(
                                    teacher.givenName,
                                    teacher.surname
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {teacher.givenName} {teacher.surname}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {teacher.emailAddress}
                                </p>
                              </div>
                              {teacher.isPrimary && (
                                <Badge variant="default" className="text-xs">
                                  {t.primary}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        {t.noTeachers}
                      </p>
                    )}

                    {/* All Subjects */}
                    {dept.subjects.length > 0 ? (
                      <div>
                        <p className="mb-2 text-sm font-medium">{t.subjects}</p>
                        <div className="flex flex-wrap gap-2">
                          {dept.subjects.map((subject) => (
                            <Badge key={subject.id} variant="outline">
                              {lang === "ar"
                                ? subject.subjectName
                                : subject.subjectName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        {t.noSubjects}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center">
            <Building className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>{t.noDepartments}</p>
            <Button
              className="mt-4"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="me-2 h-4 w-4" />
              {t.addDepartment}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingDepartment}
        onOpenChange={(open) => !open && setEditingDepartment(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editDepartment}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t.departmentName}</Label>
              <Input
                id="edit-name"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lang">{t.language}</Label>
              <select
                id="edit-lang"
                value={newDepartmentLang}
                onChange={(e) => setNewDepartmentLang(e.target.value)}
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="ar">{lang === "ar" ? "عربي" : "Arabic"}</option>
                <option value="en">
                  {lang === "ar" ? "إنجليزي" : "English"}
                </option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingDepartment(null)}
              disabled={isPending}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleUpdateDepartment}
              disabled={!newDepartmentName || isPending}
            >
              {isPending && (
                <Loader2
                  className="me-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive h-5 w-5" />
              {t.deleteDepartment}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lang === "ar"
                ? `هل أنت متأكد أنك تريد حذف "${deleteDialog.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`
                : `Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDepartment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending && (
                <Loader2
                  className="me-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {lang === "ar" ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default DepartmentsContent
