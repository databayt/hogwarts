"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Copy,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Trash2,
  TriangleAlert,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import {
  applyTimetableStructure,
  copyPeriodsToYear,
  createPeriod,
  deletePeriod,
  getPeriodsForTerm,
  getScheduleConfig,
  getSchoolYearsForSelection,
  getTermsForSelection,
  updatePeriod,
  upsertSchoolWeekConfig,
} from "../actions"
import { formatWorkingDays, TIMETABLE_STRUCTURES } from "../structures"

const DAY_LABELS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

interface Props {
  dictionary: Dictionary["school"]
  lang: Locale
}

type PeriodData = {
  id: string
  name: string
  order: number
  startTime: Date
  endTime: Date
  isBreak: boolean
}

type SchoolYear = { id: string; name: string; isCurrent: boolean }

export default function TimetableSettingsContent({ dictionary, lang }: Props) {
  const d = dictionary?.timetable
  const { toast } = useToast()

  const [isPending, startTransition] = useTransition()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [terms, setTerms] = useState<{ id: string; label: string }[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [selectedYearId, setSelectedYearId] = useState<string>("")
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([])

  const [workingDays, setWorkingDays] = useState<number[]>([0, 1, 2, 3, 4])
  const [lunchAfterPeriod, setLunchAfterPeriod] = useState<number | null>(null)
  const [periods, setPeriods] = useState<PeriodData[]>([])

  // Period management state
  const [isAddingPeriod, setIsAddingPeriod] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<PeriodData | null>(null)
  const [newPeriod, setNewPeriod] = useState({
    name: "",
    startTime: "",
    endTime: "",
  })
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false)
  const [copyTargetYearId, setCopyTargetYearId] = useState<string>("")
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)

  // Load terms and years on mount
  useEffect(() => {
    loadTerms()
    loadSchoolYears()
  }, [])

  // Load config when term changes
  useEffect(() => {
    if (selectedTerm) {
      loadConfig()
    }
  }, [selectedTerm])

  const loadTerms = async () => {
    try {
      const { terms: fetchedTerms } = await getTermsForSelection()
      setTerms(fetchedTerms)
      if (fetchedTerms.length > 0) {
        setSelectedTerm(fetchedTerms[0].id)
      }
    } catch {
      setError("Failed to load terms")
    }
  }

  const loadSchoolYears = async () => {
    try {
      const { years } = await getSchoolYearsForSelection()
      setSchoolYears(years)
    } catch {
      // Silently fail - years are optional for some operations
    }
  }

  const loadConfig = useCallback(async () => {
    startTransition(async () => {
      setError(null)
      setSuccess(null)
      try {
        const [configResult, periodsResult] = await Promise.all([
          getScheduleConfig({ termId: selectedTerm }),
          getPeriodsForTerm({ termId: selectedTerm }),
        ])

        setWorkingDays(configResult.config.workingDays)
        setLunchAfterPeriod(configResult.config.defaultLunchAfterPeriod ?? null)
        setPeriods(periodsResult.periods as PeriodData[])

        // Try to determine the year ID from the term
        // This is a workaround since terms have yearId
        if (periodsResult.periods.length > 0) {
          // Periods are year-scoped, so extract yearId from the context
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings")
      }
    })
  }, [selectedTerm])

  const toggleDay = (day: number) => {
    setWorkingDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day)
      }
      return [...prev, day].sort((a, b) => a - b)
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await upsertSchoolWeekConfig({
        termId: selectedTerm,
        workingDays,
        defaultLunchAfterPeriod: lunchAfterPeriod,
      })
      setSuccess("Settings saved successfully")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const formatTime = (date: Date) => {
    const d = new Date(date)
    return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`
  }

  // Period CRUD handlers
  const handleAddPeriod = async () => {
    if (!newPeriod.name || !newPeriod.startTime || !newPeriod.endTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (!selectedYearId) {
      toast({
        title: "Select School Year",
        description: "Please select a school year first",
        variant: "destructive",
      })
      return
    }

    try {
      await createPeriod({
        yearId: selectedYearId,
        name: newPeriod.name,
        startTime: newPeriod.startTime,
        endTime: newPeriod.endTime,
      })

      toast({ title: "Period Created", description: `${newPeriod.name} added` })
      setNewPeriod({ name: "", startTime: "", endTime: "" })
      setIsAddingPeriod(false)
      loadConfig()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePeriod = async () => {
    if (!editingPeriod) return

    try {
      await updatePeriod({
        periodId: editingPeriod.id,
        name: editingPeriod.name,
        startTime: formatTime(editingPeriod.startTime),
        endTime: formatTime(editingPeriod.endTime),
      })

      toast({ title: "Period Updated" })
      setEditingPeriod(null)
      loadConfig()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update",
        variant: "destructive",
      })
    }
  }

  const handleDeletePeriod = async (periodId: string, periodName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${periodName}"? This cannot be undone.`
      )
    ) {
      return
    }

    try {
      await deletePeriod({ periodId })
      toast({ title: "Period Deleted" })
      loadConfig()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete",
        variant: "destructive",
      })
    }
  }

  const handleCopyPeriods = async () => {
    if (!selectedYearId || !copyTargetYearId) return

    try {
      const result = await copyPeriodsToYear({
        sourceYearId: selectedYearId,
        targetYearId: copyTargetYearId,
        overwrite: false,
      })

      toast({
        title: "Periods Copied",
        description: `${result.copiedCount} copied, ${result.skippedCount} skipped`,
      })
      setIsCopyDialogOpen(false)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to copy",
        variant: "destructive",
      })
    }
  }

  const handleApplyStructure = async (slug: string) => {
    if (!selectedYearId) {
      toast({
        title: "Select School Year",
        description: "Please select a school year first",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await applyTimetableStructure({
        yearId: selectedYearId,
        structureSlug: slug,
        replaceExisting: periods.length > 0,
      })

      toast({
        title: "Structure Applied",
        description: `Created ${result.createdCount} periods`,
      })
      setIsTemplateDialogOpen(false)
      loadConfig()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to apply",
        variant: "destructive",
      })
    }
  }

  const teachingPeriods = periods.filter((p) => !p.isBreak)

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {d?.settings?.title || "Timetable Settings"}
          </CardTitle>
          <CardDescription>
            {d?.settings?.description ||
              "Configure periods, working days, and scheduling constraints"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-2">
              <Label>Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>School Year (for periods)</Label>
              <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name} {year.isCurrent && "(Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadConfig}
                disabled={isPending || !selectedTerm}
              >
                <RefreshCw
                  className={cn("me-2 h-4 w-4", isPending && "animate-spin")}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      {error && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isPending && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      )}

      {/* Settings Content */}
      {!isPending && selectedTerm && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Working Days */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Working Days
              </CardTitle>
              <CardDescription>
                Select which days of the week have scheduled classes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {DAY_LABELS.map((day) => (
                  <div
                    key={day.value}
                    className="bg-muted flex items-center justify-between rounded-lg p-3"
                  >
                    <Label
                      htmlFor={`day-${day.value}`}
                      className="cursor-pointer"
                    >
                      {day.label}
                    </Label>
                    <Switch
                      id={`day-${day.value}`}
                      checked={workingDays.includes(day.value)}
                      onCheckedChange={() => toggleDay(day.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <p className="text-muted-foreground text-sm">
                  <strong>Active:</strong>{" "}
                  {workingDays.length > 0
                    ? workingDays
                        .map((d) =>
                          DAY_LABELS.find((l) => l.value === d)?.label.slice(
                            0,
                            3
                          )
                        )
                        .join(", ")
                    : "No days selected"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lunch Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Break & Lunch
              </CardTitle>
              <CardDescription>
                Configure when lunch break occurs in the schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Lunch After Period</Label>
                <Select
                  value={lunchAfterPeriod?.toString() || "none"}
                  onValueChange={(val) =>
                    setLunchAfterPeriod(val === "none" ? null : parseInt(val))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No lunch break</SelectItem>
                    {teachingPeriods.map((period, idx) => (
                      <SelectItem key={period.id} value={(idx + 1).toString()}>
                        After Period {idx + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-sm">
                  The lunch break will appear after the selected period in the
                  timetable grid
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Period Schedule - Full Width */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5" />
                    Period Schedule
                  </CardTitle>
                  <CardDescription>
                    Manage periods for the selected school year
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {/* Template Dialog */}
                  <Dialog
                    open={isTemplateDialogOpen}
                    onOpenChange={setIsTemplateDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!selectedYearId}
                      >
                        <Clock className="me-2 h-4 w-4" />
                        Use Template
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create from Template</DialogTitle>
                        <DialogDescription>
                          Choose a template to create standard periods
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {periods.length > 0 && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Warning</AlertTitle>
                            <AlertDescription>
                              This will replace all existing periods for this
                              year.
                            </AlertDescription>
                          </Alert>
                        )}
                        <div className="grid gap-3">
                          {TIMETABLE_STRUCTURES.map((structure) => (
                            <Button
                              key={structure.slug}
                              variant="outline"
                              className="h-auto justify-start py-3"
                              onClick={() =>
                                handleApplyStructure(structure.slug)
                              }
                            >
                              <div className="text-start">
                                <div className="flex items-center gap-2">
                                  <strong>{structure.nameEn}</strong>
                                  {structure.isDefault && (
                                    <Badge variant="secondary">Default</Badge>
                                  )}
                                </div>
                                <span className="text-muted-foreground text-xs">
                                  {structure.periodsPerDay} periods &middot;{" "}
                                  {structure.schoolStart} -{" "}
                                  {structure.schoolEnd} &middot;{" "}
                                  {formatWorkingDays(structure.workingDays)}
                                </span>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Copy Dialog */}
                  <Dialog
                    open={isCopyDialogOpen}
                    onOpenChange={setIsCopyDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={periods.length === 0}
                      >
                        <Copy className="me-2 h-4 w-4" />
                        Copy to Year
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Copy Periods to Another Year</DialogTitle>
                        <DialogDescription>
                          Copy all periods from current year to another school
                          year
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Target School Year</Label>
                          <Select
                            value={copyTargetYearId}
                            onValueChange={setCopyTargetYearId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select target year" />
                            </SelectTrigger>
                            <SelectContent>
                              {schoolYears
                                .filter((y) => y.id !== selectedYearId)
                                .map((year) => (
                                  <SelectItem key={year.id} value={year.id}>
                                    {year.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsCopyDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCopyPeriods}
                          disabled={!copyTargetYearId}
                        >
                          Copy Periods
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Add Period Dialog */}
                  <Dialog
                    open={isAddingPeriod}
                    onOpenChange={setIsAddingPeriod}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={!selectedYearId}>
                        <Plus className="me-2 h-4 w-4" />
                        Add Period
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Period</DialogTitle>
                        <DialogDescription>
                          Create a new period for the schedule
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Period Name</Label>
                          <Input
                            placeholder="e.g., Period 1, Break, Lunch"
                            value={newPeriod.name}
                            onChange={(e) =>
                              setNewPeriod({
                                ...newPeriod,
                                name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Time</Label>
                            <Input
                              type="time"
                              value={newPeriod.startTime}
                              onChange={(e) =>
                                setNewPeriod({
                                  ...newPeriod,
                                  startTime: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End Time</Label>
                            <Input
                              type="time"
                              value={newPeriod.endTime}
                              onChange={(e) =>
                                setNewPeriod({
                                  ...newPeriod,
                                  endTime: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddingPeriod(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddPeriod}>Create Period</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {periods.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
                  <Clock className="mb-4 h-12 w-12 opacity-50" />
                  <p>No periods configured for this year</p>
                  <p className="text-sm">
                    Add periods manually or use a template
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Timeline visualization */}
                  <div className="bg-muted/50 relative h-16 overflow-hidden rounded-lg">
                    {periods.map((period) => {
                      const start = new Date(period.startTime)
                      const end = new Date(period.endTime)
                      const totalMinutes = 16 * 60 // 6AM to 10PM = 16 hours
                      const startOffset =
                        (start.getUTCHours() - 6) * 60 + start.getUTCMinutes()
                      const duration =
                        (end.getUTCHours() - start.getUTCHours()) * 60 +
                        (end.getUTCMinutes() - start.getUTCMinutes())
                      const leftPercent = (startOffset / totalMinutes) * 100
                      const widthPercent = (duration / totalMinutes) * 100

                      return (
                        <div
                          key={period.id}
                          className={cn(
                            "absolute flex h-full items-center justify-center overflow-hidden rounded border text-xs font-medium",
                            period.isBreak
                              ? "bg-secondary border-secondary-foreground/20"
                              : "bg-primary text-primary-foreground"
                          )}
                          style={{
                            left: `${Math.max(0, leftPercent)}%`,
                            width: `${widthPercent}%`,
                          }}
                          title={`${period.name}: ${formatTime(period.startTime)} - ${formatTime(period.endTime)}`}
                        >
                          <span className="truncate px-1">
                            {period.name.replace("Period ", "P")}
                          </span>
                        </div>
                      )
                    })}
                    {/* Time markers */}
                    <div className="text-muted-foreground absolute bottom-0 left-0 w-full text-[10px]">
                      <span className="absolute" style={{ left: "0%" }}>
                        6AM
                      </span>
                      <span className="absolute" style={{ left: "25%" }}>
                        10AM
                      </span>
                      <span className="absolute" style={{ left: "50%" }}>
                        2PM
                      </span>
                      <span className="absolute" style={{ left: "75%" }}>
                        6PM
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Period List */}
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {periods.map((period) => (
                      <div
                        key={period.id}
                        className={cn(
                          "group relative rounded-lg border p-4",
                          period.isBreak
                            ? "bg-muted/50 border-dashed"
                            : "bg-muted"
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-medium">{period.name}</span>
                          <div className="flex items-center gap-1">
                            {period.isBreak && (
                              <Badge variant="secondary" className="text-xs">
                                Break
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={() => setEditingPeriod(period)}
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={() =>
                                handleDeletePeriod(period.id, period.name)
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {formatTime(period.startTime)} -{" "}
                          {formatTime(period.endTime)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Period Dialog */}
      <Dialog
        open={!!editingPeriod}
        onOpenChange={(open) => !open && setEditingPeriod(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Period</DialogTitle>
          </DialogHeader>
          {editingPeriod && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Period Name</Label>
                <Input
                  value={editingPeriod.name}
                  onChange={(e) =>
                    setEditingPeriod({ ...editingPeriod, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formatTime(editingPeriod.startTime)}
                    onChange={(e) =>
                      setEditingPeriod({
                        ...editingPeriod,
                        startTime: new Date(`1970-01-01T${e.target.value}:00Z`),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={formatTime(editingPeriod.endTime)}
                    onChange={(e) =>
                      setEditingPeriod({
                        ...editingPeriod,
                        endTime: new Date(`1970-01-01T${e.target.value}:00Z`),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPeriod(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePeriod}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Button */}
      {!isPending && selectedTerm && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="me-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      )}

      {/* No Term Selected */}
      {!selectedTerm && !isPending && (
        <div className="text-muted-foreground py-12 text-center">
          <Settings className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>Select a term to configure settings</p>
        </div>
      )}
    </div>
  )
}
