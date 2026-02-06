"use client"

import * as React from "react"
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  Clock,
  Plus,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

import { useAcademicDictionary } from "@/hooks/use-academic-dictionary"
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
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

import {
  deletePeriod,
  deleteSchoolYear,
  deleteTerm,
  getPeriodsForYear,
  getSchoolYears,
  getTermsForYear,
  setActiveTerm,
} from "./actions"
import { PeriodForm } from "./period-form"
import { PeriodList } from "./period-list"
import { TermForm } from "./term-form"
import { TermList } from "./term-list"
import type { Period, SchoolYear, Term } from "./types"
import { YearForm } from "./year-form"
import { YearList } from "./year-list"

interface AcademicContentProps {
  dictionary: Dictionary
  lang: Locale
}

export function AcademicContent({ dictionary, lang }: AcademicContentProps) {
  const dict = useAcademicDictionary(dictionary)

  // Data states
  const [years, setYears] = React.useState<SchoolYear[]>([])
  const [terms, setTerms] = React.useState<Term[]>([])
  const [periods, setPeriods] = React.useState<Period[]>([])
  const [selectedYearId, setSelectedYearId] = React.useState<string | null>(
    null
  )
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingTerms, setIsLoadingTerms] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Form dialog states
  const [yearFormOpen, setYearFormOpen] = React.useState(false)
  const [termFormOpen, setTermFormOpen] = React.useState(false)
  const [periodFormOpen, setPeriodFormOpen] = React.useState(false)

  // Editing states
  const [editingYear, setEditingYear] = React.useState<SchoolYear | null>(null)
  const [editingTerm, setEditingTerm] = React.useState<Term | null>(null)
  const [editingPeriod, setEditingPeriod] = React.useState<Period | null>(null)

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean
    type: "year" | "term" | "period"
    id: string
    name: string
  }>({ open: false, type: "year", id: "", name: "" })

  // Fetch years on mount
  React.useEffect(() => {
    fetchYears()
  }, [])

  // Fetch terms and periods when year is selected
  React.useEffect(() => {
    if (selectedYearId) {
      fetchTermsAndPeriods(selectedYearId)
    } else {
      setTerms([])
      setPeriods([])
    }
  }, [selectedYearId])

  const fetchYears = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getSchoolYears()
      if (result.success && result.data?.years) {
        setYears(result.data.years)
        // Auto-select first year if none selected
        if (result.data.years.length > 0 && !selectedYearId) {
          setSelectedYearId(result.data.years[0].id)
        }
      } else if (!result.success) {
        setError(result.message || "Failed to load academic years")
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load academic years"
      console.error("Failed to fetch years:", err)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTermsAndPeriods = async (yearId: string) => {
    setIsLoadingTerms(true)
    try {
      const [termsResult, periodsResult] = await Promise.all([
        getTermsForYear(yearId),
        getPeriodsForYear(yearId),
      ])

      if (termsResult.success && termsResult.data?.terms) {
        setTerms(termsResult.data.terms)
      }

      if (periodsResult.success && periodsResult.data?.periods) {
        setPeriods(periodsResult.data.periods)
      }
    } catch (err) {
      console.error("Failed to fetch terms/periods:", err)
      toast.error("Failed to load terms and periods")
    } finally {
      setIsLoadingTerms(false)
    }
  }

  // Year handlers
  const handleEditYear = (year: SchoolYear) => {
    setEditingYear(year)
    setYearFormOpen(true)
  }

  const handleDeleteYear = (yearId: string) => {
    const year = years.find((y) => y.id === yearId)
    setDeleteDialog({
      open: true,
      type: "year",
      id: yearId,
      name: year?.yearName || "",
    })
  }

  const handleAddYear = () => {
    setEditingYear(null)
    setYearFormOpen(true)
  }

  // Term handlers
  const handleEditTerm = (term: Term) => {
    setEditingTerm(term)
    setTermFormOpen(true)
  }

  const handleDeleteTerm = (termId: string) => {
    const term = terms.find((t) => t.id === termId)
    setDeleteDialog({
      open: true,
      type: "term",
      id: termId,
      name: `Term ${term?.termNumber}` || "",
    })
  }

  const handleAddTerm = () => {
    setEditingTerm(null)
    setTermFormOpen(true)
  }

  const handleSetActiveTerm = async (termId: string) => {
    const formData = new FormData()
    formData.append("id", termId)
    const result = await setActiveTerm(formData)
    if (result.success) {
      toast.success("Active term updated")
      if (selectedYearId) {
        fetchTermsAndPeriods(selectedYearId)
      }
    } else {
      toast.error(result.message || "Failed to set active term")
    }
  }

  // Period handlers
  const handleEditPeriod = (period: Period) => {
    setEditingPeriod(period)
    setPeriodFormOpen(true)
  }

  const handleDeletePeriod = (periodId: string) => {
    const period = periods.find((p) => p.id === periodId)
    setDeleteDialog({
      open: true,
      type: "period",
      id: periodId,
      name: period?.name || "",
    })
  }

  const handleAddPeriod = () => {
    setEditingPeriod(null)
    setPeriodFormOpen(true)
  }

  // Confirm delete
  const handleConfirmDelete = async () => {
    const formData = new FormData()
    formData.append("id", deleteDialog.id)

    let result
    switch (deleteDialog.type) {
      case "year":
        result = await deleteSchoolYear(formData)
        if (result.success) {
          if (selectedYearId === deleteDialog.id) {
            setSelectedYearId(null)
          }
          fetchYears()
        }
        break
      case "term":
        result = await deleteTerm(formData)
        if (result.success && selectedYearId) {
          fetchTermsAndPeriods(selectedYearId)
        }
        break
      case "period":
        result = await deletePeriod(formData)
        if (result.success && selectedYearId) {
          fetchTermsAndPeriods(selectedYearId)
        }
        break
    }

    if (result?.success) {
      toast.success(result.message || "Deleted successfully")
    } else {
      toast.error(result?.message || "Failed to delete")
    }

    setDeleteDialog({ ...deleteDialog, open: false })
  }

  // Refresh handlers
  const handleYearSuccess = () => {
    fetchYears()
  }

  const handleTermSuccess = () => {
    if (selectedYearId) {
      fetchTermsAndPeriods(selectedYearId)
    }
  }

  const handlePeriodSuccess = () => {
    if (selectedYearId) {
      fetchTermsAndPeriods(selectedYearId)
    }
  }

  const selectedYear = years.find((y) => y.id === selectedYearId)
  const existingTermNumbers = React.useMemo(
    () => terms.map((t) => t.termNumber),
    [terms]
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeadingSetter title={dict.title || "Academic Year Setup"} />

      {/* Description */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          {dict.title || "Academic Year Setup"}
        </h2>
        <p className="text-muted-foreground">
          {dict.description ||
            "Configure academic years, terms, and daily class periods for your school."}
        </p>
      </div>

      {/* Error State with Retry */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchYears}
              className="ms-4"
            >
              <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
              {dict.retry || "Retry"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Column 1: Academic Years */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar
                  className="text-muted-foreground h-4 w-4"
                  aria-hidden="true"
                />
                <CardTitle className="text-base">
                  {dict.academicYears || "Academic Years"}
                </CardTitle>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddYear}
                aria-label={dict.addYear || "Add academic year"}
              >
                <Plus className="me-1 h-4 w-4" aria-hidden="true" />
                {dict.add || "Add"}
              </Button>
            </div>
            <CardDescription className="text-xs">
              {dict.yearsDescription || "Define academic year periods"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <YearList
              years={years}
              selectedYearId={selectedYearId}
              onSelectYear={setSelectedYearId}
              onEditYear={handleEditYear}
              onDeleteYear={handleDeleteYear}
              dictionary={dictionary}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Column 2: Terms */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays
                  className="text-muted-foreground h-4 w-4"
                  aria-hidden="true"
                />
                <CardTitle className="text-base">
                  {dict.terms || "Terms"}
                </CardTitle>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddTerm}
                disabled={!selectedYearId}
                aria-label={dict.addTerm || "Add term"}
              >
                <Plus className="me-1 h-4 w-4" aria-hidden="true" />
                {dict.add || "Add"}
              </Button>
            </div>
            <CardDescription className="text-xs">
              {selectedYear
                ? `${dict.termsFor || "Terms for"} ${selectedYear.yearName}`
                : dict.termsDescription || "Semesters or quarters"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TermList
              terms={terms}
              selectedYearId={selectedYearId}
              onEditTerm={handleEditTerm}
              onDeleteTerm={handleDeleteTerm}
              onSetActiveTerm={handleSetActiveTerm}
              dictionary={dictionary}
              isLoading={isLoadingTerms}
            />
          </CardContent>
        </Card>

        {/* Column 3: Daily Periods */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock
                  className="text-muted-foreground h-4 w-4"
                  aria-hidden="true"
                />
                <CardTitle className="text-base">
                  {dict.dailyPeriods || "Daily Periods"}
                </CardTitle>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddPeriod}
                disabled={!selectedYearId}
                aria-label={dict.addPeriod || "Add period"}
              >
                <Plus className="me-1 h-4 w-4" aria-hidden="true" />
                {dict.add || "Add"}
              </Button>
            </div>
            <CardDescription className="text-xs">
              {selectedYear
                ? `${dict.periodsFor || "Periods for"} ${selectedYear.yearName}`
                : dict.periodsDescription || "Class time slots"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PeriodList
              periods={periods}
              selectedYearId={selectedYearId}
              onEditPeriod={handleEditPeriod}
              onDeletePeriod={handleDeletePeriod}
              dictionary={dictionary}
              isLoading={isLoadingTerms}
            />
          </CardContent>
        </Card>
      </div>

      {/* Year Form Dialog */}
      <YearForm
        open={yearFormOpen}
        onOpenChange={setYearFormOpen}
        editingYear={editingYear}
        onSuccess={handleYearSuccess}
        dictionary={dictionary}
      />

      {/* Term Form Dialog */}
      {selectedYearId && (
        <TermForm
          open={termFormOpen}
          onOpenChange={setTermFormOpen}
          yearId={selectedYearId}
          editingTerm={editingTerm}
          existingTermNumbers={existingTermNumbers}
          onSuccess={handleTermSuccess}
          dictionary={dictionary}
        />
      )}

      {/* Period Form Dialog */}
      {selectedYearId && (
        <PeriodForm
          open={periodFormOpen}
          onOpenChange={setPeriodFormOpen}
          yearId={selectedYearId}
          editingPeriod={editingPeriod}
          existingPeriodCount={periods.length}
          onSuccess={handlePeriodSuccess}
          dictionary={dictionary}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive h-5 w-5" />
              {dict.confirmDelete || "Confirm Delete"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dict.deleteWarning ||
                `Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.cancel || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {dict.delete || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
