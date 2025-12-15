/**
 * Year Levels Management Content
 *
 * Manages academic year/grade levels (e.g., Grade 9, Grade 10, Year 12) with:
 * - CRUD operations for year levels with bilingual naming
 * - Ordered display: levelOrder determines progression sequence
 * - Aggregated stats: total students enrolled, batch assignments per level
 * - Loading skeleton during data fetch for perceived performance
 * - Error state with retry button for network resilience
 *
 * Client component for:
 * - Form dialogs (create/edit) with bilingual input fields
 * - Confirmation dialogs for destructive delete operations
 * - Loading states during async server action execution
 * - Real-time search across English and Arabic level names
 *
 * Multi-tenant: All CRUD operations scoped by schoolId via server actions
 * Design pattern: Uses useTransition for non-blocking server mutations
 */
"use client"

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import {
  GraduationCap,
  Users,
  Layers,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertCircle,
  RefreshCw,
  Loader2,
  ArrowUpDown,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'
import {
  getYearLevels,
  createYearLevel,
  updateYearLevel,
  deleteYearLevel,
} from './actions'

// ============================================================================
// Types
// ============================================================================

interface YearLevel {
  id: string
  levelName: string
  levelNameAr?: string | null
  levelOrder: number
  _count?: {
    studentYearLevels: number
    batches: number
  }
}

interface Props {
  dictionary?: Dictionary['school']
  lang: Locale
}

// ============================================================================
// Component
// ============================================================================

export function YearLevelsContent({
  dictionary,
  lang,
}: Props) {
  // Data states
  const [yearLevels, setYearLevels] = useState<YearLevel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI states
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingLevel, setEditingLevel] = useState<YearLevel | null>(null)
  const [newLevelName, setNewLevelName] = useState('')
  const [newLevelNameAr, setNewLevelNameAr] = useState('')
  const [newLevelOrder, setNewLevelOrder] = useState('')

  // Delete confirmation state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    id: string
    name: string
  }>({ open: false, id: '', name: '' })

  // Action states
  const [isPending, startTransition] = useTransition()

  // Translations
  const t = {
    title: lang === 'ar' ? 'إدارة المراحل الدراسية' : 'Year Level Management',
    subtitle: lang === 'ar' ? 'إدارة المراحل والصفوف الدراسية' : 'Manage grade levels and academic years',
    search: lang === 'ar' ? 'البحث في المراحل...' : 'Search year levels...',
    addLevel: lang === 'ar' ? 'إضافة مرحلة' : 'Add Year Level',
    editLevel: lang === 'ar' ? 'تعديل المرحلة' : 'Edit Year Level',
    deleteLevel: lang === 'ar' ? 'حذف المرحلة' : 'Delete Year Level',
    levelName: lang === 'ar' ? 'اسم المرحلة' : 'Level Name',
    levelNameAr: lang === 'ar' ? 'اسم المرحلة (عربي)' : 'Level Name (Arabic)',
    levelOrder: lang === 'ar' ? 'ترتيب المرحلة' : 'Level Order',
    students: lang === 'ar' ? 'الطلاب' : 'Students',
    batches: lang === 'ar' ? 'الدفعات' : 'Batches',
    save: lang === 'ar' ? 'حفظ' : 'Save',
    cancel: lang === 'ar' ? 'إلغاء' : 'Cancel',
    delete: lang === 'ar' ? 'حذف' : 'Delete',
    noLevels: lang === 'ar' ? 'لا توجد مراحل دراسية' : 'No year levels found',
    totalLevels: lang === 'ar' ? 'إجمالي المراحل' : 'Total Levels',
    totalStudents: lang === 'ar' ? 'إجمالي الطلاب' : 'Total Students',
    totalBatches: lang === 'ar' ? 'إجمالي الدفعات' : 'Total Batches',
    retry: lang === 'ar' ? 'إعادة المحاولة' : 'Retry',
    order: lang === 'ar' ? 'الترتيب' : 'Order',
    levelOrderHint: lang === 'ar' ? 'رقم يحدد ترتيب المرحلة (1، 2، 3...)' : 'Number that determines level order (1, 2, 3...)',
  }

  // Fetch year levels on mount
  useEffect(() => {
    fetchYearLevels()
  }, [])

  const fetchYearLevels = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getYearLevels()
      if (result.success && result.data?.yearLevels) {
        setYearLevels(result.data.yearLevels as unknown as YearLevel[])
      } else if (!result.success) {
        setError(result.message || 'Failed to load year levels')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load year levels'
      console.error('Failed to fetch year levels:', err)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter year levels
  const filteredLevels = yearLevels.filter(level => {
    const name = lang === 'ar' ? (level.levelNameAr || level.levelName) : level.levelName
    return name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Calculate aggregated statistics across all year levels
  // Reduces counts from Prisma _count field to total numbers
  const stats = {
    totalLevels: yearLevels.length,
    // Sum all students across all year levels
    totalStudents: yearLevels.reduce((sum, l) => sum + (l._count?.studentYearLevels || 0), 0),
    // Sum all batch assignments across all year levels
    totalBatches: yearLevels.reduce((sum, l) => sum + (l._count?.batches || 0), 0),
  }

  // Calculate next available order value for new year level
  // Ensures sequential numbering and maintains sort order
  const getNextOrder = () => {
    if (yearLevels.length === 0) return 1
    return Math.max(...yearLevels.map(l => l.levelOrder)) + 1
  }

  const handleCreateLevel = async () => {
    if (!newLevelName || !newLevelOrder) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append('levelName', newLevelName)
      if (newLevelNameAr) {
        formData.append('levelNameAr', newLevelNameAr)
      }
      formData.append('levelOrder', newLevelOrder)

      const result = await createYearLevel(formData)
      if (result.success) {
        toast.success(result.message || 'Year level created successfully')
        setNewLevelName('')
        setNewLevelNameAr('')
        setNewLevelOrder('')
        setIsCreateDialogOpen(false)
        fetchYearLevels()
      } else {
        toast.error(result.message || 'Failed to create year level')
      }
    })
  }

  const handleUpdateLevel = async () => {
    if (!editingLevel || !newLevelName || !newLevelOrder) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append('id', editingLevel.id)
      formData.append('levelName', newLevelName)
      formData.append('levelNameAr', newLevelNameAr || '')
      formData.append('levelOrder', newLevelOrder)

      const result = await updateYearLevel(formData)
      if (result.success) {
        toast.success(result.message || 'Year level updated successfully')
        setEditingLevel(null)
        setNewLevelName('')
        setNewLevelNameAr('')
        setNewLevelOrder('')
        fetchYearLevels()
      } else {
        toast.error(result.message || 'Failed to update year level')
      }
    })
  }

  const handleDeleteLevel = async () => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('id', deleteDialog.id)

      const result = await deleteYearLevel(formData)
      if (result.success) {
        toast.success(result.message || 'Year level deleted successfully')
        fetchYearLevels()
      } else {
        toast.error(result.message || 'Failed to delete year level')
      }
      setDeleteDialog({ ...deleteDialog, open: false })
    })
  }

  const openCreateDialog = () => {
    setNewLevelName('')
    setNewLevelNameAr('')
    setNewLevelOrder(String(getNextOrder()))
    setIsCreateDialogOpen(true)
  }

  const openEditDialog = (level: YearLevel) => {
    setEditingLevel(level)
    setNewLevelName(level.levelName)
    setNewLevelNameAr(level.levelNameAr || '')
    setNewLevelOrder(String(level.levelOrder))
  }

  const openDeleteDialog = (level: YearLevel) => {
    const name = lang === 'ar' ? (level.levelNameAr || level.levelName) : level.levelName
    setDeleteDialog({ open: true, id: level.id, name })
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading year levels">
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <span className="sr-only">Loading year levels...</span>
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
              onClick={fetchYearLevels}
              className="ms-4"
            >
              <RefreshCw className="h-4 w-4 me-2" aria-hidden="true" />
              {t.retry}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t.addLevel}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.addLevel}</DialogTitle>
              <DialogDescription>
                {lang === 'ar' ? 'أضف مرحلة دراسية جديدة' : 'Add a new year level to the school'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.levelName}</Label>
                <Input
                  id="name"
                  value={newLevelName}
                  onChange={(e) => setNewLevelName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: الصف الأول' : 'e.g., Grade 1'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameAr">{t.levelNameAr}</Label>
                <Input
                  id="nameAr"
                  value={newLevelNameAr}
                  onChange={(e) => setNewLevelNameAr(e.target.value)}
                  placeholder="مثال: الصف الأول"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">{t.levelOrder}</Label>
                <Input
                  id="order"
                  type="number"
                  min="1"
                  value={newLevelOrder}
                  onChange={(e) => setNewLevelOrder(e.target.value)}
                  placeholder="1"
                />
                <p className="text-xs text-muted-foreground">{t.levelOrderHint}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isPending}>
                {t.cancel}
              </Button>
              <Button onClick={handleCreateLevel} disabled={!newLevelName || !newLevelOrder || isPending}>
                {isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" aria-hidden="true" />}
                {t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.totalLevels}</p>
                <p className="text-2xl font-bold">{stats.totalLevels}</p>
              </div>
              <Layers className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.totalStudents}</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.totalBatches}</p>
                <p className="text-2xl font-bold">{stats.totalBatches}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-9"
              aria-label={t.search}
            />
          </div>
        </CardContent>
      </Card>

      {/* Year Levels Grid */}
      {filteredLevels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLevels.map((level) => (
            <Card key={level.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 flex items-center justify-center min-w-10 min-h-10">
                      <span className="text-lg font-bold text-primary">{level.levelOrder}</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {lang === 'ar' ? (level.levelNameAr || level.levelName) : level.levelName}
                      </CardTitle>
                      {level.levelNameAr && lang !== 'ar' && (
                        <CardDescription>{level.levelNameAr}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(level)}
                      aria-label={`${t.editLevel} ${level.levelName}`}
                    >
                      <Edit className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(level)}
                      aria-label={`${t.deleteLevel} ${level.levelName}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span>{level._count?.studentYearLevels || 0} {t.students}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span>{level._count?.batches || 0} {t.batches}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
            <p>{t.noLevels}</p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 me-2" aria-hidden="true" />
              {t.addLevel}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingLevel} onOpenChange={(open) => !open && setEditingLevel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editLevel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t.levelName}</Label>
              <Input
                id="edit-name"
                value={newLevelName}
                onChange={(e) => setNewLevelName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nameAr">{t.levelNameAr}</Label>
              <Input
                id="edit-nameAr"
                value={newLevelNameAr}
                onChange={(e) => setNewLevelNameAr(e.target.value)}
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-order">{t.levelOrder}</Label>
              <Input
                id="edit-order"
                type="number"
                min="1"
                value={newLevelOrder}
                onChange={(e) => setNewLevelOrder(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t.levelOrderHint}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLevel(null)} disabled={isPending}>
              {t.cancel}
            </Button>
            <Button onClick={handleUpdateLevel} disabled={!newLevelName || !newLevelOrder || isPending}>
              {isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" aria-hidden="true" />}
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
              <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
              {t.deleteLevel}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lang === 'ar'
                ? `هل أنت متأكد أنك تريد حذف "${deleteDialog.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`
                : `Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLevel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" aria-hidden="true" />}
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default YearLevelsContent
