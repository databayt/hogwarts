"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useState, useTransition } from "react"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  Play,
  RefreshCw,
  Save,
  Settings2,
  Sparkles,
  Users,
  Wand2,
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import {
  applyGeneratedTimetable,
  generateTimetablePreview,
  getTermsForSelection,
} from "../actions"
import type { GeneratedSlot, GenerationConfig } from "./algorithm"

interface Props {
  dictionary: Dictionary["school"]
  lang: Locale
}

interface GenerationStats {
  totalSlots: number
  placedSlots: number
  conflictsResolved: number
  optimizationScore: number
  teacherWorkloadBalance: number
  roomUtilization: number
  generationTimeMs: number
  iterations: number
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const DAY_NAMES_AR = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
]

export default function GenerateTimetableContent({ dictionary, lang }: Props) {
  const d = dictionary?.timetable
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  // State
  const [terms, setTerms] = useState<Array<{ id: string; label: string }>>([])
  const [selectedTermId, setSelectedTermId] = useState<string>("")
  const [isConfigOpen, setIsConfigOpen] = useState(true)
  const [previewSlots, setPreviewSlots] = useState<GeneratedSlot[]>([])
  const [stats, setStats] = useState<GenerationStats | null>(null)
  const [unplacedClasses, setUnplacedClasses] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isApplying, setIsApplying] = useState(false)

  // Configuration state
  const [config, setConfig] = useState<Partial<GenerationConfig>>({
    constraints: {
      enforceTeacherExpertise: true,
      enforceRoomCapacity: true,
      maxTeacherPeriodsPerDay: 6,
      maxTeacherPeriodsPerWeek: 25,
      maxConsecutivePeriods: 3,
      requireLunchBreak: true,
      preventBackToBack: false,
    },
    preferences: {
      balanceSubjectDistribution: true,
      preferMorningForCore: true,
      avoidLastPeriodForLab: true,
      groupSameSubjectDays: false,
    },
  })

  // Load terms on mount
  const loadTerms = useCallback(async () => {
    try {
      const { terms: loadedTerms } = await getTermsForSelection()
      setTerms(loadedTerms)
      if (loadedTerms.length > 0 && !selectedTermId) {
        setSelectedTermId(loadedTerms[0].id)
      }
    } catch (error) {
      toast({
        title: d?.generate?.errors || "Error",
        description: "Failed to load terms",
        variant: "destructive",
      })
    }
  }, [selectedTermId, toast])

  // Load terms once
  useState(() => {
    loadTerms()
  })

  // Generate preview
  const handleGenerate = () => {
    if (!selectedTermId) {
      toast({
        title: d?.generate?.termSelection || "Select a Term",
        description:
          d?.generate?.selectTerm ||
          "Please select a term to generate timetable for",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const result = await generateTimetablePreview({
          termId: selectedTermId,
          config,
        })

        setPreviewSlots(result.preview)
        setStats(result.stats)
        setUnplacedClasses(result.unplacedClasses)
        setWarnings(result.warnings)
        setErrors(result.errors)
        setIsConfigOpen(false)

        if (result.success) {
          toast({
            title: d?.generate?.generationComplete || "Generation Complete",
            description: `Successfully generated ${result.stats.placedSlots} slots`,
          })
        } else {
          toast({
            title: d?.generate?.generationPartial || "Generation Partial",
            description: `Generated ${result.stats.placedSlots}/${result.stats.totalSlots} slots with ${result.errors.length} errors`,
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: d?.generate?.generationFailed || "Generation Failed",
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        })
      }
    })
  }

  // Apply generated timetable
  const handleApply = async (clearExisting: boolean) => {
    if (previewSlots.length === 0) return

    setIsApplying(true)
    try {
      const result = await applyGeneratedTimetable({
        termId: selectedTermId,
        slots: previewSlots,
        clearExisting,
      })

      if (result.success) {
        toast({
          title: d?.generate?.timetableApplied || "Timetable Applied",
          description: `Successfully created ${result.createdCount} slots`,
        })
        // Reset preview state
        setPreviewSlots([])
        setStats(null)
      } else {
        toast({
          title: d?.generate?.applicationFailed || "Application Failed",
          description: result.errors.join(", "),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: d?.generate?.applicationFailed || "Application Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsApplying(false)
    }
  }

  // Default constraint values
  const defaultConstraints: GenerationConfig["constraints"] = {
    enforceTeacherExpertise: true,
    enforceRoomCapacity: true,
    maxTeacherPeriodsPerDay: 6,
    maxTeacherPeriodsPerWeek: 25,
    maxConsecutivePeriods: 3,
    requireLunchBreak: true,
    preventBackToBack: false,
  }

  // Default preference values
  const defaultPreferences: GenerationConfig["preferences"] = {
    balanceSubjectDistribution: true,
    preferMorningForCore: true,
    avoidLastPeriodForLab: true,
    groupSameSubjectDays: false,
  }

  // Update config helper
  const updateConstraint = (
    key: keyof NonNullable<GenerationConfig["constraints"]>,
    value: boolean | number
  ) => {
    setConfig((prev) => ({
      ...prev,
      constraints: {
        ...defaultConstraints,
        ...prev.constraints,
        [key]: value,
      },
    }))
  }

  const updatePreference = (
    key: keyof NonNullable<GenerationConfig["preferences"]>,
    value: boolean
  ) => {
    setConfig((prev) => ({
      ...prev,
      preferences: {
        ...defaultPreferences,
        ...prev.preferences,
        [key]: value,
      },
    }))
  }

  // Group preview slots by day for display
  const slotsByDay = previewSlots.reduce(
    (acc, slot) => {
      if (!acc[slot.dayOfWeek]) {
        acc[slot.dayOfWeek] = []
      }
      acc[slot.dayOfWeek].push(slot)
      return acc
    },
    {} as Record<number, GeneratedSlot[]>
  )

  const dayNames = lang === "ar" ? DAY_NAMES_AR : DAY_NAMES

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="from-primary/5 via-primary/10 to-primary/5 border-primary/20 bg-gradient-to-r">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <Wand2 className="text-primary h-6 w-6" />
              </div>
              <div>
                <CardTitle>
                  {d?.generate?.title || "Generate Timetable"}
                </CardTitle>
                <CardDescription>
                  {d?.generate?.description ||
                    "AI-powered automatic schedule generation with conflict detection"}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {d?.generate?.aiPowered || "AI Powered"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Term Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {d?.generate?.termSelection || "Term Selection"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedTermId} onValueChange={setSelectedTermId}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue
                placeholder={d?.generate?.selectTerm || "Select a term"}
              />
            </SelectTrigger>
            <SelectContent>
              {terms.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Collapsible open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  {d?.generate?.generationSettings || "Generation Settings"}
                </CardTitle>
                {isConfigOpen ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </div>
            </CollapsibleTrigger>
            <CardDescription>
              {d?.generate?.configureConstraints ||
                "Configure constraints and preferences for schedule generation"}
            </CardDescription>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Hard Constraints */}
              <div className="space-y-4">
                <h4>{d?.generate?.hardConstraints || "Hard Constraints"}</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>
                        {d?.generate?.enforceTeacherExpertise ||
                          "Enforce Teacher Expertise"}
                      </Label>
                      <p className="text-muted-foreground">
                        <small>
                          {d?.generate?.enforceTeacherExpertiseDesc ||
                            "Teachers only assigned to subjects they're qualified for"}
                        </small>
                      </p>
                    </div>
                    <Switch
                      checked={config.constraints?.enforceTeacherExpertise}
                      onCheckedChange={(v) =>
                        updateConstraint("enforceTeacherExpertise", v)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>
                        {d?.generate?.enforceRoomCapacity ||
                          "Enforce Room Capacity"}
                      </Label>
                      <p className="text-muted-foreground">
                        <small>
                          {d?.generate?.enforceRoomCapacityDesc ||
                            "Class size must fit in assigned room"}
                        </small>
                      </p>
                    </div>
                    <Switch
                      checked={config.constraints?.enforceRoomCapacity}
                      onCheckedChange={(v) =>
                        updateConstraint("enforceRoomCapacity", v)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>
                        {d?.generate?.requireLunchBreak ||
                          "Require Lunch Break"}
                      </Label>
                      <p className="text-muted-foreground">
                        <small>
                          {d?.generate?.requireLunchBreakDesc ||
                            "Ensure teachers have break during lunch period"}
                        </small>
                      </p>
                    </div>
                    <Switch
                      checked={config.constraints?.requireLunchBreak}
                      onCheckedChange={(v) =>
                        updateConstraint("requireLunchBreak", v)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>
                        {d?.generate?.preventBackToBack ||
                          "Prevent Back-to-Back"}
                      </Label>
                      <p className="text-muted-foreground">
                        <small>
                          {d?.generate?.preventBackToBackDesc ||
                            "Avoid consecutive periods in different rooms"}
                        </small>
                      </p>
                    </div>
                    <Switch
                      checked={config.constraints?.preventBackToBack}
                      onCheckedChange={(v) =>
                        updateConstraint("preventBackToBack", v)
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Numeric Constraints */}
              <div className="space-y-4">
                <h4>{d?.generate?.workloadLimits || "Workload Limits"}</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>
                      {d?.generate?.maxPeriodsPerDay || "Max Periods/Day"}
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={config.constraints?.maxTeacherPeriodsPerDay ?? 6}
                      onChange={(e) =>
                        updateConstraint(
                          "maxTeacherPeriodsPerDay",
                          parseInt(e.target.value) || 6
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {d?.generate?.maxPeriodsPerWeek || "Max Periods/Week"}
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={40}
                      value={config.constraints?.maxTeacherPeriodsPerWeek ?? 25}
                      onChange={(e) =>
                        updateConstraint(
                          "maxTeacherPeriodsPerWeek",
                          parseInt(e.target.value) || 25
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {d?.generate?.maxConsecutive || "Max Consecutive"}
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={8}
                      value={config.constraints?.maxConsecutivePeriods ?? 3}
                      onChange={(e) =>
                        updateConstraint(
                          "maxConsecutivePeriods",
                          parseInt(e.target.value) || 3
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Soft Preferences */}
              <div className="space-y-4">
                <h4>
                  {d?.generate?.optimizationPreferences ||
                    "Optimization Preferences"}
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="balance"
                      checked={config.preferences?.balanceSubjectDistribution}
                      onCheckedChange={(v) =>
                        updatePreference("balanceSubjectDistribution", !!v)
                      }
                    />
                    <Label htmlFor="balance">
                      {d?.generate?.balanceDistribution ||
                        "Balance subject distribution across week"}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="morning"
                      checked={config.preferences?.preferMorningForCore}
                      onCheckedChange={(v) =>
                        updatePreference("preferMorningForCore", !!v)
                      }
                    />
                    <Label htmlFor="morning">
                      {d?.generate?.preferMorningCore ||
                        "Schedule core subjects in morning"}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="lab"
                      checked={config.preferences?.avoidLastPeriodForLab}
                      onCheckedChange={(v) =>
                        updatePreference("avoidLastPeriodForLab", !!v)
                      }
                    />
                    <Label htmlFor="lab">
                      {d?.generate?.avoidLastPeriodLab ||
                        "Avoid last period for lab activities"}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="group"
                      checked={config.preferences?.groupSameSubjectDays}
                      onCheckedChange={(v) =>
                        updatePreference("groupSameSubjectDays", !!v)
                      }
                    />
                    <Label htmlFor="group">
                      {d?.generate?.groupSameSubjectDays ||
                        "Group same subject on alternating days"}
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleGenerate}
                disabled={!selectedTermId || isPending}
                className="gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {d?.generate?.generating || "Generating..."}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    {d?.generate?.generatePreview || "Generate Preview"}
                  </>
                )}
              </Button>
            </CardFooter>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Generation Results */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              {d?.generate?.generationResults || "Generation Results"}
            </CardTitle>
            <CardDescription>
              Generated in {stats.generationTimeMs.toFixed(0)}ms with{" "}
              {stats.iterations} iterations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1 rounded-lg border p-3">
                <p className="text-muted-foreground">
                  <small>{d?.generate?.slotsPlaced || "Slots Placed"}</small>
                </p>
                <p>
                  <strong>
                    {stats.placedSlots} / {stats.totalSlots}
                  </strong>
                </p>
                <Progress
                  value={(stats.placedSlots / stats.totalSlots) * 100}
                  className={cn(
                    "h-2",
                    (stats.placedSlots / stats.totalSlots) * 100 >= 80
                      ? "[&>div]:bg-green-500"
                      : (stats.placedSlots / stats.totalSlots) * 100 >= 50
                        ? "[&>div]:bg-amber-500"
                        : "[&>div]:bg-red-500"
                  )}
                />
              </div>
              <div className="space-y-1 rounded-lg border p-3">
                <p className="text-muted-foreground">
                  <small>
                    {d?.generate?.optimizationScore || "Optimization Score"}
                  </small>
                </p>
                <p>
                  <strong>{stats.optimizationScore}%</strong>
                </p>
                <Progress
                  value={stats.optimizationScore}
                  className={cn(
                    "h-2",
                    stats.optimizationScore >= 80
                      ? "[&>div]:bg-green-500"
                      : stats.optimizationScore >= 50
                        ? "[&>div]:bg-amber-500"
                        : "[&>div]:bg-red-500"
                  )}
                />
              </div>
              <div className="space-y-1 rounded-lg border p-3">
                <p className="text-muted-foreground">
                  <small>
                    {d?.generate?.workloadBalance || "Workload Balance"}
                  </small>
                </p>
                <p>
                  <strong>{stats.teacherWorkloadBalance}%</strong>
                </p>
                <Progress
                  value={stats.teacherWorkloadBalance}
                  className={cn(
                    "h-2",
                    stats.teacherWorkloadBalance >= 80
                      ? "[&>div]:bg-green-500"
                      : stats.teacherWorkloadBalance >= 50
                        ? "[&>div]:bg-amber-500"
                        : "[&>div]:bg-red-500"
                  )}
                />
              </div>
              <div className="space-y-1 rounded-lg border p-3">
                <p className="text-muted-foreground">
                  <small>
                    {d?.generate?.roomUtilization || "Room Utilization"}
                  </small>
                </p>
                <p>
                  <strong>{stats.roomUtilization}%</strong>
                </p>
                <Progress
                  value={stats.roomUtilization}
                  className={cn(
                    "h-2",
                    stats.roomUtilization >= 80
                      ? "[&>div]:bg-green-500"
                      : stats.roomUtilization >= 50
                        ? "[&>div]:bg-amber-500"
                        : "[&>div]:bg-red-500"
                  )}
                />
              </div>
            </div>

            {/* Warnings/Errors */}
            {(warnings.length > 0 || errors.length > 0) && (
              <div className="space-y-2">
                {errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Errors ({errors.length})</AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 list-inside list-disc">
                        {errors.slice(0, 5).map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                        {errors.length > 5 && (
                          <li>...and {errors.length - 5} more</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                {warnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Warnings ({warnings.length})</AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 list-inside list-disc">
                        {warnings.slice(0, 5).map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                        {warnings.length > 5 && (
                          <li>...and {warnings.length - 5} more</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Unplaced Classes */}
            {unplacedClasses.length > 0 && (
              <Alert variant="destructive">
                <Users className="h-4 w-4" />
                <AlertTitle>
                  Unplaced Classes ({unplacedClasses.length})
                </AlertTitle>
                <AlertDescription>
                  These classes could not be fully scheduled. Check teacher
                  availability and room capacity.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Table */}
      {previewSlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {d?.generate?.schedulePreview || "Schedule Preview"}
            </CardTitle>
            <CardDescription>
              {d?.generate?.reviewBeforeApply ||
                "Review the generated schedule before applying"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{d?.generate?.day || "Day"}</TableHead>
                    <TableHead>{d?.generate?.period || "Period"}</TableHead>
                    <TableHead>{d?.generate?.class || "Class"}</TableHead>
                    <TableHead>{d?.generate?.teacher || "Teacher"}</TableHead>
                    <TableHead>{d?.generate?.room || "Room"}</TableHead>
                    <TableHead>{d?.generate?.score || "Score"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(slotsByDay)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([day, slots]) =>
                      slots
                        .sort((a, b) => a.periodId.localeCompare(b.periodId))
                        .map((slot, idx) => (
                          <TableRow key={`${day}-${slot.periodId}-${idx}`}>
                            <TableCell>
                              <Badge variant="outline">
                                {dayNames[parseInt(day)]}
                              </Badge>
                            </TableCell>
                            <TableCell>P{slot.periodId.slice(-1)}</TableCell>
                            <TableCell>{slot.classId.slice(0, 8)}...</TableCell>
                            <TableCell>
                              {slot.teacherId.slice(0, 8)}...
                            </TableCell>
                            <TableCell>
                              {slot.classroomId.slice(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge
                                      variant={
                                        slot.score >= 70
                                          ? "default"
                                          : slot.score >= 50
                                            ? "secondary"
                                            : "destructive"
                                      }
                                    >
                                      {slot.score}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {slot.violations.length > 0 ? (
                                      <ul>
                                        {slot.violations.map((v, i) => (
                                          <li key={i}>{v}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      d?.generate?.noViolations ||
                                      "No violations"
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={isPending}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {d?.generate?.regenerate || "Regenerate"}
              </Button>
            </div>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => handleApply(false)}
                      disabled={isApplying}
                      className="gap-2"
                    >
                      {isApplying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      {d?.generate?.merge || "Merge"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {d?.generate?.mergeDesc ||
                      "Add to existing schedule (keeps current slots)"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => handleApply(true)}
                      disabled={isApplying}
                      className="gap-2"
                    >
                      {isApplying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {d?.generate?.replaceAll || "Replace All"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {d?.generate?.replaceAllDesc ||
                      "Clear existing and apply new schedule"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Empty State */}
      {!isPending && previewSlots.length === 0 && !stats && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2">
              {d?.generate?.readyToGenerate || "Ready to Generate"}
            </h3>
            <p className="text-muted-foreground mb-4 text-center">
              {d?.generate?.readyDesc ||
                'Configure your constraints and click "Generate Preview" to create an optimized timetable'}
            </p>
            <Button
              onClick={handleGenerate}
              disabled={!selectedTermId}
              className="gap-2"
            >
              <Wand2 className="h-4 w-4" />
              {d?.generate?.generatePreview || "Generate Preview"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
