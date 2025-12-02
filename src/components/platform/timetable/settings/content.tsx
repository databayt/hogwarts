'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Settings, RefreshCw, TriangleAlert, Calendar, Clock, Save, Check } from "lucide-react"
import { cn } from '@/lib/utils'
import { type Dictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import {
  getTermsForSelection,
  getScheduleConfig,
  getPeriodsForTerm,
  upsertSchoolWeekConfig
} from '../actions'

const DAY_LABELS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

interface Props {
  dictionary: Dictionary['school']
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

export default function TimetableSettingsContent({ dictionary }: Props) {
  const d = dictionary?.timetable

  const [isPending, startTransition] = useTransition()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [terms, setTerms] = useState<{ id: string; label: string }[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>('')

  const [workingDays, setWorkingDays] = useState<number[]>([0, 1, 2, 3, 4])
  const [lunchAfterPeriod, setLunchAfterPeriod] = useState<number | null>(null)
  const [periods, setPeriods] = useState<PeriodData[]>([])

  // Load terms on mount
  useEffect(() => {
    loadTerms()
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
      setError('Failed to load terms')
    }
  }

  const loadConfig = async () => {
    startTransition(async () => {
      setError(null)
      setSuccess(null)
      try {
        const [configResult, periodsResult] = await Promise.all([
          getScheduleConfig({ termId: selectedTerm }),
          getPeriodsForTerm({ termId: selectedTerm })
        ])

        setWorkingDays(configResult.config.workingDays)
        setLunchAfterPeriod(configResult.config.defaultLunchAfterPeriod ?? null)
        setPeriods(periodsResult.periods as PeriodData[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      }
    })
  }

  const toggleDay = (day: number) => {
    setWorkingDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day)
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
        defaultLunchAfterPeriod: lunchAfterPeriod
      })
      setSuccess('Settings saved successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const formatTime = (date: Date) => {
    const d = new Date(date)
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`
  }

  const teachingPeriods = periods.filter(p => !p.isBreak)

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {d?.settings?.title || 'Timetable Settings'}
          </CardTitle>
          <CardDescription>
            {d?.settings?.description || 'Configure periods, working days, and scheduling constraints'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map(term => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm" onClick={loadConfig} disabled={isPending || !selectedTerm}>
                <RefreshCw className={cn("h-4 w-4 me-2", isPending && "animate-spin")} />
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
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
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
                {DAY_LABELS.map(day => (
                  <div
                    key={day.value}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <Label htmlFor={`day-${day.value}`} className="cursor-pointer">
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

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>Active:</strong>{' '}
                  {workingDays.length > 0
                    ? workingDays.map(d => DAY_LABELS.find(l => l.value === d)?.label.slice(0, 3)).join(', ')
                    : 'No days selected'}
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
                  value={lunchAfterPeriod?.toString() || 'none'}
                  onValueChange={(val) => setLunchAfterPeriod(val === 'none' ? null : parseInt(val))}
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
                <p className="text-sm text-muted-foreground">
                  The lunch break will appear after the selected period in the timetable grid
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Period Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Period Schedule
              </CardTitle>
              <CardDescription>
                Current period configuration for this term (view only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {periods.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No periods configured for this term
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {periods.map(period => (
                    <div
                      key={period.id}
                      className={cn(
                        "p-4 rounded-lg border",
                        period.isBreak ? "bg-muted/50 border-dashed" : "bg-muted"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{period.name}</span>
                        {period.isBreak && (
                          <Badge variant="secondary" className="text-xs">Break</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(period.startTime)} - {formatTime(period.endTime)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Button */}
      {!isPending && selectedTerm && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 me-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 me-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      )}

      {/* No Term Selected */}
      {!selectedTerm && !isPending && (
        <div className="text-center py-12 text-muted-foreground">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a term to configure settings</p>
        </div>
      )}
    </div>
  )
}
