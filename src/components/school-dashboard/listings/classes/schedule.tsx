"use client"

import { useEffect, useState } from "react"
import { type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getPeriodsForTerm,
  getRoomsForSelection,
  getTermsForSelection,
} from "@/components/school-dashboard/timetable/actions"

import { ClassFormStepProps } from "./types"
import { classCreateSchema } from "./validation"

export function ScheduleStep({ form, isView }: ClassFormStepProps) {
  const [terms, setTerms] = useState<Array<{ id: string; termName: string }>>(
    []
  )
  const [periods, setPeriods] = useState<
    Array<{ id: string; periodName: string }>
  >([])
  const [classrooms, setClassrooms] = useState<
    Array<{ id: string; roomName: string; capacity: number }>
  >([])
  const [isLoading, setIsLoading] = useState(true)

  // Watch termId to load periods when term changes
  const selectedTermId = form.watch("termId")

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        // Load terms from database
        const termsRes = await getTermsForSelection()
        if (termsRes.terms) {
          setTerms(
            termsRes.terms.map((t: any) => ({
              id: t.id,
              termName: t.termNumber
                ? `Term ${t.termNumber}`
                : t.termName || "Unknown",
            }))
          )
        }

        // Load classrooms from database
        const roomsRes = await getRoomsForSelection()
        if (roomsRes.rooms) {
          setClassrooms(
            roomsRes.rooms.map((r: any) => ({
              id: r.id,
              roomName: r.label || r.roomName || "Unknown",
              capacity: r.capacity ?? 0,
            }))
          )
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadInitialData()
  }, [])

  // Load periods when term changes
  useEffect(() => {
    const loadPeriods = async () => {
      if (!selectedTermId) {
        setPeriods([])
        return
      }
      try {
        const periodsRes = await getPeriodsForTerm({ termId: selectedTermId })
        if (periodsRes.periods) {
          setPeriods(
            periodsRes.periods.map((p: any) => ({
              id: p.id,
              periodName:
                p.periodLabel || `Period ${p.periodNumber}` || "Unknown",
            }))
          )
        }
      } catch (error) {
        console.error("Failed to load periods:", error)
        setPeriods([])
      }
    }
    loadPeriods()
  }, [selectedTermId])

  return (
    <div className="w-full space-y-4">
      <FormField
        control={form.control}
        name="termId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Term</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isView}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.termName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="startPeriodId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Start Period</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isView}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select start period" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.periodName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="endPeriodId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>End Period</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isView}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select end period" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.periodName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="classroomId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Classroom</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isView}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select classroom" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {classrooms.map((classroom) => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    {classroom.roomName}
                    {classroom.capacity > 0
                      ? ` (${classroom.capacity} seats)`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
