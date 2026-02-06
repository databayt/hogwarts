"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { format, parseISO } from "date-fns"
import { Calendar, CalendarPlus, Copy, Pencil, Trash2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarUI } from "@/components/ui/calendar"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  copyScheduleSettings,
  createScheduleException,
  deleteScheduleException,
  getScheduleExceptions,
  getTermDetails,
  getTermsForCopy,
  updateScheduleException,
  updateTermDates,
} from "./actions"
import { WORKING_DAY_PRESETS } from "./constants"

type ExceptionType = "HOLIDAY" | "EVENT" | "MODIFIED_SCHEDULE" | "CANCELLED"

type ScheduleException = {
  id: string
  exceptionType: string
  title: string
  description: string | null
  startDate: Date | string
  endDate: Date | string
  isAllDay: boolean
  affectsAllClasses: boolean
  isRecurring: boolean
  recurrenceRule: string | null
  termId: string | null
}

type TermDetails = {
  id: string
  termNumber: number
  startDate: Date | string
  endDate: Date | string
  isActive: boolean
  schoolYear: { id: string; yearName: string }
}

type TermOption = {
  id: string
  label: string
  startDate: Date | string
  endDate: Date | string
  yearId: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  termId: string | null
  onSaved?: () => void
  dictionary?: Dictionary["school"]
}

export function ScheduleSettingsDialog({
  open,
  onOpenChange,
  termId,
  onSaved,
  dictionary,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState("general")

  // Get timetable dictionary with fallbacks
  const ttDict = dictionary?.timetable?.scheduleSettings || {
    title: "Schedule Settings",
    configureTermSchedule: "Configure term schedule",
    tabs: {
      general: "General",
      holidays: "Holidays",
      copySettings: "Copy Settings",
    },
    termDuration: "Term Duration",
    startDate: "Start Date",
    endDate: "End Date",
    pickDate: "Pick a date",
    workingDaysPreset: "Working Days Preset",
    selectPreset: "Select preset",
    workingDays: "Working Days",
    lunchAfterPeriod: "Lunch After Period",
    notSet: "Not set",
    holidayCalendar: "Holiday Calendar",
    addHoliday: "Add Holiday",
    editException: "Edit Exception",
    newException: "New Exception",
    type: "Type",
    exceptionTitle: "Title",
    descriptionLabel: "Description (optional)",
    descriptionPlaceholder: "Additional details...",
    allDay: "All day",
    affectsAllClasses: "Affects all classes",
    cancel: "Cancel",
    saving: "Saving...",
    save: "Save",
    noHolidays: "No holidays or events configured",
    copyToTerm: "Copy Settings To Another Term",
    copyDescription:
      "Copy working days, lunch configuration, and optionally holidays to another term.",
    selectTargetTerm: "Select target term...",
    includeHolidays: "Include holidays and events",
    copying: "Copying...",
    copySettings: "Copy Settings",
    close: "Close",
    saveSettings: "Save Settings",
  }

  const placeholdersDict = dictionary?.timetable?.placeholders || {
    exampleNationalDay: "e.g., National Day",
  }

  const daysDict = dictionary?.timetable?.days || {
    sun: "Sun",
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
  }

  const exTypesDict = dictionary?.timetable?.exceptionTypes || {
    holiday: "Holiday",
    event: "Event",
    modifiedSchedule: "Modified Schedule",
    cancelled: "Cancelled",
  }

  // Build day labels from dictionary
  const dayLabels = useMemo(
    () => [
      daysDict.sun || "Sun",
      daysDict.mon || "Mon",
      daysDict.tue || "Tue",
      daysDict.wed || "Wed",
      daysDict.thu || "Thu",
      daysDict.fri || "Fri",
      daysDict.sat || "Sat",
    ],
    [daysDict]
  )

  // Build exception types with labels from dictionary
  const exceptionTypes = useMemo(
    () => [
      {
        value: "HOLIDAY",
        label: exTypesDict.holiday || "Holiday",
        color: "bg-red-100 text-red-800",
      },
      {
        value: "EVENT",
        label: exTypesDict.event || "Event",
        color: "bg-blue-100 text-blue-800",
      },
      {
        value: "MODIFIED_SCHEDULE",
        label: exTypesDict.modifiedSchedule || "Modified Schedule",
        color: "bg-yellow-100 text-yellow-800",
      },
      {
        value: "CANCELLED",
        label: exTypesDict.cancelled || "Cancelled",
        color: "bg-gray-100 text-gray-800",
      },
    ],
    [exTypesDict]
  )

  // General settings
  const [workingDays, setWorkingDays] = useState<number[]>([0, 1, 2, 3, 4])
  const [preset, setPreset] = useState<string>("sun-thu")
  const [periods, setPeriods] = useState<Array<{ id: string; name: string }>>(
    []
  )
  const [lunchAfter, setLunchAfter] = useState<string>("")

  // Term details
  const [termDetails, setTermDetails] = useState<TermDetails | null>(null)
  const [termStartDate, setTermStartDate] = useState<Date | undefined>()
  const [termEndDate, setTermEndDate] = useState<Date | undefined>()

  // Holiday calendar
  const [exceptions, setExceptions] = useState<ScheduleException[]>([])
  const [showExceptionForm, setShowExceptionForm] = useState(false)
  const [editingException, setEditingException] =
    useState<ScheduleException | null>(null)
  const [exceptionForm, setExceptionForm] = useState({
    type: "HOLIDAY" as ExceptionType,
    title: "",
    description: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    isAllDay: true,
    affectsAllClasses: true,
  })

  // Copy settings
  const [termsForCopy, setTermsForCopy] = useState<TermOption[]>([])
  const [selectedTargetTerm, setSelectedTargetTerm] = useState<string>("")
  const [includeExceptions, setIncludeExceptions] = useState(true)

  const disabled = !termId

  // Load initial data
  useEffect(() => {
    if (!termId || !open) return

    const loadData = async () => {
      try {
        // Load config and periods
        const [cfgRes, perRes] = await Promise.all([
          fetch(`/api/schedule?termId=${termId}`),
          fetch(`/api/periods?termId=${termId}`),
        ])
        const cfg = await cfgRes.json()
        const pr = await perRes.json()

        const days = cfg.config?.workingDays ?? [0, 1, 2, 3, 4]
        setWorkingDays(days)
        setLunchAfter(
          cfg.config?.defaultLunchAfterPeriod != null
            ? String(cfg.config.defaultLunchAfterPeriod)
            : ""
        )
        setPeriods(pr.periods ?? [])

        // Detect preset from working days
        const daysStr = JSON.stringify([...days].sort())
        if (daysStr === JSON.stringify([0, 1, 2, 3, 4])) {
          setPreset("sun-thu")
        } else if (daysStr === JSON.stringify([1, 2, 3, 4, 5])) {
          setPreset("mon-fri")
        } else if (daysStr === JSON.stringify([1, 2, 3, 4, 5, 6])) {
          setPreset("mon-sat")
        } else {
          setPreset("custom")
        }

        // Load term details
        const term = await getTermDetails({ termId })
        setTermDetails(term)
        setTermStartDate(new Date(term.startDate))
        setTermEndDate(new Date(term.endDate))

        // Load exceptions
        const exc = await getScheduleExceptions({ termId })
        setExceptions(exc)

        // Load terms for copy
        const terms = await getTermsForCopy()
        setTermsForCopy(terms.filter((t) => t.id !== termId))
      } catch (error) {
        console.error("Failed to load settings:", error)
      }
    }

    loadData()
  }, [termId, open])

  const toggleDay = (d: number) => {
    setWorkingDays((prev) => {
      const newDays = prev.includes(d)
        ? prev.filter((x) => x !== d)
        : [...prev, d].sort((a, b) => a - b)
      setPreset("custom")
      return newDays
    })
  }

  const applyPreset = (presetKey: string) => {
    setPreset(presetKey)
    if (presetKey !== "custom") {
      const presetData =
        WORKING_DAY_PRESETS[presetKey as keyof typeof WORKING_DAY_PRESETS]
      if (presetData) {
        setWorkingDays([...presetData.days])
      }
    }
  }

  const onSaveGeneral = async () => {
    if (!termId) return

    startTransition(async () => {
      try {
        // Save week config
        await fetch("/api/schedule/config", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            termId,
            workingDays,
            defaultLunchAfterPeriod: lunchAfter ? Number(lunchAfter) : null,
          }),
        })

        // Save term dates if changed
        if (termStartDate && termEndDate) {
          await updateTermDates({
            termId,
            startDate: termStartDate,
            endDate: termEndDate,
          })
        }

        onSaved?.()
      } catch (error) {
        console.error("Failed to save settings:", error)
      }
    })
  }

  // Exception handlers
  const resetExceptionForm = () => {
    setExceptionForm({
      type: "HOLIDAY",
      title: "",
      description: "",
      startDate: undefined,
      endDate: undefined,
      isAllDay: true,
      affectsAllClasses: true,
    })
    setEditingException(null)
    setShowExceptionForm(false)
  }

  const handleSaveException = async () => {
    if (!termId || !exceptionForm.startDate || !exceptionForm.endDate) return

    // Capture values for use in transition (narrows the type)
    const startDate = exceptionForm.startDate
    const endDate = exceptionForm.endDate

    startTransition(async () => {
      try {
        if (editingException) {
          await updateScheduleException({
            id: editingException.id,
            exceptionType: exceptionForm.type,
            title: exceptionForm.title,
            description: exceptionForm.description || undefined,
            startDate,
            endDate,
            isAllDay: exceptionForm.isAllDay,
            affectsAllClasses: exceptionForm.affectsAllClasses,
          })
        } else {
          await createScheduleException({
            termId,
            exceptionType: exceptionForm.type,
            title: exceptionForm.title,
            description: exceptionForm.description || undefined,
            startDate,
            endDate,
            isAllDay: exceptionForm.isAllDay,
            affectsAllClasses: exceptionForm.affectsAllClasses,
          })
        }

        // Refresh exceptions
        const exc = await getScheduleExceptions({ termId })
        setExceptions(exc)
        resetExceptionForm()
      } catch (error) {
        console.error("Failed to save exception:", error)
      }
    })
  }

  const handleEditException = (exc: ScheduleException) => {
    setEditingException(exc)
    setExceptionForm({
      type: exc.exceptionType as ExceptionType,
      title: exc.title,
      description: exc.description || "",
      startDate: new Date(exc.startDate),
      endDate: new Date(exc.endDate),
      isAllDay: exc.isAllDay,
      affectsAllClasses: exc.affectsAllClasses,
    })
    setShowExceptionForm(true)
  }

  const handleDeleteException = async (id: string) => {
    if (!termId) return

    startTransition(async () => {
      try {
        await deleteScheduleException({ id })
        const exc = await getScheduleExceptions({ termId })
        setExceptions(exc)
      } catch (error) {
        console.error("Failed to delete exception:", error)
      }
    })
  }

  // Copy settings handler
  const handleCopySettings = async () => {
    if (!termId || !selectedTargetTerm) return

    startTransition(async () => {
      try {
        await copyScheduleSettings({
          sourceTermId: termId,
          targetTermId: selectedTargetTerm,
          includeExceptions,
        })
        setSelectedTargetTerm("")
      } catch (error) {
        console.error("Failed to copy settings:", error)
      }
    })
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? parseISO(date) : date
    return format(d, "MMM d, yyyy")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{ttDict.title || "Schedule Settings"}</DialogTitle>
          <DialogDescription>
            {termDetails
              ? `${termDetails.schoolYear.yearName} - Term ${termDetails.termNumber}`
              : ttDict.configureTermSchedule || "Configure term schedule"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">
              {ttDict.tabs?.general || "General"}
            </TabsTrigger>
            <TabsTrigger value="holidays">
              {ttDict.tabs?.holidays || "Holidays"}
            </TabsTrigger>
            <TabsTrigger value="copy">
              {ttDict.tabs?.copySettings || "Copy Settings"}
            </TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6 pt-4">
            {/* Term Duration */}
            <div className="space-y-3">
              <Label>{ttDict.termDuration || "Term Duration"}</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground mb-1 block text-sm">
                    {ttDict.startDate || "Start Date"}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-start font-normal",
                          !termStartDate && "text-muted-foreground"
                        )}
                        disabled={disabled}
                      >
                        <Calendar className="me-2 h-4 w-4" />
                        {termStartDate
                          ? format(termStartDate, "PPP")
                          : ttDict.pickDate || "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarUI
                        mode="single"
                        selected={termStartDate}
                        onSelect={setTermStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-muted-foreground mb-1 block text-sm">
                    {ttDict.endDate || "End Date"}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-start font-normal",
                          !termEndDate && "text-muted-foreground"
                        )}
                        disabled={disabled}
                      >
                        <Calendar className="me-2 h-4 w-4" />
                        {termEndDate
                          ? format(termEndDate, "PPP")
                          : ttDict.pickDate || "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarUI
                        mode="single"
                        selected={termEndDate}
                        onSelect={setTermEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <Separator />

            {/* Working Days Presets */}
            <div className="space-y-3">
              <Label>{ttDict.workingDaysPreset || "Working Days Preset"}</Label>
              <Select value={preset} onValueChange={applyPreset}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={ttDict.selectPreset || "Select preset"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(WORKING_DAY_PRESETS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Individual Days */}
            <div className="space-y-3">
              <Label className="block">
                {ttDict.workingDays || "Working Days"}
              </Label>
              <div className="flex flex-wrap gap-3">
                {dayLabels.map((label, idx) => (
                  <label key={label} className="flex items-center gap-2">
                    <Checkbox
                      checked={workingDays.includes(idx)}
                      onCheckedChange={() => toggleDay(idx)}
                      disabled={disabled}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            {/* Lunch Period */}
            <div className="space-y-3">
              <Label>{ttDict.lunchAfterPeriod || "Lunch After Period"}</Label>
              <Select
                value={lunchAfter}
                onValueChange={setLunchAfter}
                disabled={disabled}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder={ttDict.notSet || "Not set"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{ttDict.notSet || "Not set"}</SelectItem>
                  {periods.map((p, idx) => (
                    <SelectItem key={p.id} value={String(idx)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Holidays Tab */}
          <TabsContent value="holidays" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label>{ttDict.holidayCalendar || "Holiday Calendar"}</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowExceptionForm(true)}
                disabled={disabled}
              >
                <CalendarPlus className="me-2 h-4 w-4" />
                {ttDict.addHoliday || "Add Holiday"}
              </Button>
            </div>

            {/* Exception Form */}
            {showExceptionForm && (
              <div className="bg-muted/50 space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    {editingException
                      ? ttDict.editException || "Edit Exception"
                      : ttDict.newException || "New Exception"}
                  </h4>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={resetExceptionForm}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{ttDict.type || "Type"}</Label>
                    <Select
                      value={exceptionForm.type}
                      onValueChange={(v) =>
                        setExceptionForm((f) => ({
                          ...f,
                          type: v as ExceptionType,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {exceptionTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{ttDict.exceptionTitle || "Title"}</Label>
                    <Input
                      value={exceptionForm.title}
                      onChange={(e) =>
                        setExceptionForm((f) => ({
                          ...f,
                          title: e.target.value,
                        }))
                      }
                      placeholder={
                        placeholdersDict.exampleNationalDay ||
                        "e.g., National Day"
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{ttDict.startDate || "Start Date"}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-start font-normal",
                            !exceptionForm.startDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="me-2 h-4 w-4" />
                          {exceptionForm.startDate
                            ? format(exceptionForm.startDate, "PPP")
                            : ttDict.pickDate || "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarUI
                          mode="single"
                          selected={exceptionForm.startDate}
                          onSelect={(d) =>
                            setExceptionForm((f) => ({ ...f, startDate: d }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>{ttDict.endDate || "End Date"}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-start font-normal",
                            !exceptionForm.endDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="me-2 h-4 w-4" />
                          {exceptionForm.endDate
                            ? format(exceptionForm.endDate, "PPP")
                            : ttDict.pickDate || "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarUI
                          mode="single"
                          selected={exceptionForm.endDate}
                          onSelect={(d) =>
                            setExceptionForm((f) => ({ ...f, endDate: d }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label>
                    {ttDict.descriptionLabel || "Description (optional)"}
                  </Label>
                  <Textarea
                    value={exceptionForm.description}
                    onChange={(e) =>
                      setExceptionForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder={
                      ttDict.descriptionPlaceholder || "Additional details..."
                    }
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={exceptionForm.isAllDay}
                      onCheckedChange={(c) =>
                        setExceptionForm((f) => ({ ...f, isAllDay: !!c }))
                      }
                    />
                    <span className="text-sm">
                      {ttDict.allDay || "All day"}
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={exceptionForm.affectsAllClasses}
                      onCheckedChange={(c) =>
                        setExceptionForm((f) => ({
                          ...f,
                          affectsAllClasses: !!c,
                        }))
                      }
                    />
                    <span className="text-sm">
                      {ttDict.affectsAllClasses || "Affects all classes"}
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetExceptionForm}>
                    {ttDict.cancel || "Cancel"}
                  </Button>
                  <Button
                    onClick={handleSaveException}
                    disabled={
                      !exceptionForm.title ||
                      !exceptionForm.startDate ||
                      !exceptionForm.endDate ||
                      isPending
                    }
                  >
                    {isPending
                      ? ttDict.saving || "Saving..."
                      : ttDict.save || "Save"}
                  </Button>
                </div>
              </div>
            )}

            {/* Exception List */}
            <div className="space-y-2">
              {exceptions.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  {ttDict.noHolidays || "No holidays or events configured"}
                </p>
              ) : (
                exceptions.map((exc) => {
                  const typeInfo = exceptionTypes.find(
                    (t) => t.value === exc.exceptionType
                  )
                  return (
                    <div
                      key={exc.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={cn("text-xs", typeInfo?.color)}>
                          {typeInfo?.label || exc.exceptionType}
                        </Badge>
                        <div>
                          <p className="font-medium">{exc.title}</p>
                          <p className="text-muted-foreground text-sm">
                            {formatDate(exc.startDate)}
                            {exc.startDate !== exc.endDate &&
                              ` – ${formatDate(exc.endDate)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditException(exc)}
                          disabled={isPending}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteException(exc.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </TabsContent>

          {/* Copy Settings Tab */}
          <TabsContent value="copy" className="space-y-4 pt-4">
            <div className="space-y-3">
              <Label>
                {ttDict.copyToTerm || "Copy Settings To Another Term"}
              </Label>
              <p className="text-muted-foreground text-sm">
                {ttDict.copyDescription ||
                  "Copy working days, lunch configuration, and optionally holidays to another term."}
              </p>

              <Select
                value={selectedTargetTerm}
                onValueChange={setSelectedTargetTerm}
                disabled={disabled || termsForCopy.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      ttDict.selectTargetTerm || "Select target term..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {termsForCopy.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <label className="flex items-center gap-2">
                <Checkbox
                  checked={includeExceptions}
                  onCheckedChange={(c) => setIncludeExceptions(!!c)}
                  disabled={disabled}
                />
                <span className="text-sm">
                  {ttDict.includeHolidays || "Include holidays and events"}
                </span>
              </label>

              <Button
                onClick={handleCopySettings}
                disabled={!selectedTargetTerm || isPending}
                className="w-full"
              >
                <Copy className="me-2 h-4 w-4" />
                {isPending
                  ? ttDict.copying || "Copying..."
                  : ttDict.copySettings || "Copy Settings"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {ttDict.close || "Close"}
          </Button>
          {activeTab === "general" && (
            <Button onClick={onSaveGeneral} disabled={disabled || isPending}>
              {isPending
                ? ttDict.saving || "Saving..."
                : ttDict.saveSettings || "Save Settings"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
