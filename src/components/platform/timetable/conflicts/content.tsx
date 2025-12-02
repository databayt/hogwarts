'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { TriangleAlert, RefreshCw, CircleCheck, User, DoorOpen, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Dictionary } from '@/components/internationalization/dictionaries'
import {
  getTermsForSelection,
  detectTimetableConflicts
} from '../actions'

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
  dictionary: Dictionary['school']
}

type Conflict = {
  type: 'TEACHER' | 'ROOM'
  classA: { id: string; name: string }
  classB: { id: string; name: string }
  teacher?: { id: string; name: string } | null
  room?: { id: string; name: string } | null
}

export default function TimetableConflictsContent({ dictionary }: Props) {
  const d = dictionary?.timetable

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [terms, setTerms] = useState<{ id: string; label: string }[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>('')
  const [conflicts, setConflicts] = useState<Conflict[]>([])

  // Load terms on mount
  useEffect(() => {
    loadTerms()
  }, [])

  // Detect conflicts when term changes
  useEffect(() => {
    if (selectedTerm) {
      detectConflicts()
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

  const detectConflicts = async () => {
    startTransition(async () => {
      setError(null)
      try {
        const { conflicts: detected } = await detectTimetableConflicts({ termId: selectedTerm })
        setConflicts(detected)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to detect conflicts')
      }
    })
  }

  const teacherConflicts = conflicts.filter(c => c.type === 'TEACHER')
  const roomConflicts = conflicts.filter(c => c.type === 'ROOM')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5" />
            {d?.conflicts?.title || 'Timetable Conflicts'}
          </CardTitle>
          <CardDescription>
            {d?.conflicts?.description || 'Detect and resolve scheduling conflicts'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
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

            <div className="flex items-end">
              <Button variant="outline" size="sm" onClick={detectConflicts} disabled={isPending || !selectedTerm}>
                <RefreshCw className={cn("h-4 w-4 me-2", isPending && "animate-spin")} />
                Scan for Conflicts
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <TriangleAlert className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading */}
          {isPending && (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          )}

          {/* Results */}
          {!isPending && selectedTerm && (
            <div className="space-y-6">
              {/* Summary */}
              <div className={cn(
                "p-4 rounded-lg border",
                conflicts.length === 0
                  ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                  : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
              )}>
                <div className="flex items-center gap-3">
                  {conflicts.length === 0 ? (
                    <>
                      <CircleCheck className="h-6 w-6 text-green-600" />
                      <div>
                        <h3 className="font-semibold text-green-800 dark:text-green-200">No Conflicts Found</h3>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          The timetable has no scheduling conflicts
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <TriangleAlert className="h-6 w-6 text-red-600" />
                      <div>
                        <h3 className="font-semibold text-red-800 dark:text-red-200">
                          {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''} Detected
                        </h3>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {teacherConflicts.length} teacher conflict{teacherConflicts.length !== 1 ? 's' : ''}, {roomConflicts.length} room conflict{roomConflicts.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Teacher Conflicts */}
              {teacherConflicts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Teacher Conflicts
                  </h3>
                  <div className="space-y-2">
                    {teacherConflicts.map((conflict, idx) => (
                      <div
                        key={`teacher-${idx}`}
                        className="p-4 bg-muted rounded-lg flex flex-wrap items-center gap-3"
                      >
                        <Badge variant="destructive">
                          <User className="h-3 w-3 me-1" />
                          {conflict.teacher?.name || 'Unknown Teacher'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">assigned to both</span>
                        <Badge variant="outline">{conflict.classA.name}</Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">{conflict.classB.name}</Badge>
                        <span className="text-sm text-muted-foreground">at the same time</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Room Conflicts */}
              {roomConflicts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <DoorOpen className="h-4 w-4" />
                    Room Conflicts
                  </h3>
                  <div className="space-y-2">
                    {roomConflicts.map((conflict, idx) => (
                      <div
                        key={`room-${idx}`}
                        className="p-4 bg-muted rounded-lg flex flex-wrap items-center gap-3"
                      >
                        <Badge variant="destructive">
                          <DoorOpen className="h-3 w-3 me-1" />
                          {conflict.room?.name || 'Unknown Room'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">booked for both</span>
                        <Badge variant="outline">{conflict.classA.name}</Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">{conflict.classB.name}</Badge>
                        <span className="text-sm text-muted-foreground">at the same time</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Term Selected */}
          {!selectedTerm && !isPending && (
            <div className="text-center py-12 text-muted-foreground">
              <TriangleAlert className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a term to scan for conflicts</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
