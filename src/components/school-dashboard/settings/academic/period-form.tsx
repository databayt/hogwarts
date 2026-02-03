"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { Icons } from "@/components/icons"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { createPeriod, updatePeriod } from "./actions"
import type { Period } from "./types"
import { createPeriodSchema, type CreatePeriodInput } from "./validation"

interface PeriodFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  yearId: string
  editingPeriod?: Period | null
  existingPeriodCount: number
  onSuccess: () => void
  dictionary?: Dictionary
}

export function PeriodForm({
  open,
  onOpenChange,
  yearId,
  editingPeriod,
  existingPeriodCount,
  onSuccess,
  dictionary,
}: PeriodFormProps) {
  // Academic dictionary - fallback to empty for now
  const dict =
    ((dictionary?.school as Record<string, unknown>)?.academic as
      | Record<string, string>
      | undefined) ?? {}
  const [isPending, setIsPending] = React.useState(false)

  // Format time from Date to HH:MM string
  const formatTimeToString = (time: Date | string): string => {
    if (typeof time === "string") return time
    const date = new Date(time)
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `${hours}:${minutes}`
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePeriodInput>({
    resolver: zodResolver(createPeriodSchema),
    defaultValues: editingPeriod
      ? {
          yearId,
          name: editingPeriod.name,
          startTime: formatTimeToString(editingPeriod.startTime),
          endTime: formatTimeToString(editingPeriod.endTime),
        }
      : {
          yearId,
          name: "",
          startTime: "",
          endTime: "",
        },
  })

  // Reset form when dialog opens/closes or editingPeriod changes
  React.useEffect(() => {
    if (open) {
      if (editingPeriod) {
        reset({
          yearId,
          name: editingPeriod.name,
          startTime: formatTimeToString(editingPeriod.startTime),
          endTime: formatTimeToString(editingPeriod.endTime),
        })
      } else {
        // Suggest next period name
        const nextPeriodNumber = existingPeriodCount + 1
        reset({
          yearId,
          name: `Period ${nextPeriodNumber}`,
          startTime: "",
          endTime: "",
        })
      }
    }
  }, [editingPeriod, open, reset, yearId, existingPeriodCount])

  const onSubmit = async (data: CreatePeriodInput) => {
    setIsPending(true)

    try {
      const formData = new FormData()
      formData.append("yearId", data.yearId)
      formData.append("name", data.name)
      formData.append("startTime", data.startTime)
      formData.append("endTime", data.endTime)

      let result
      if (editingPeriod) {
        formData.append("id", editingPeriod.id)
        result = await updatePeriod(formData)
      } else {
        result = await createPeriod(formData)
      }

      if (result.success) {
        toast.success(
          result.message ||
            (editingPeriod ? "Period updated" : "Period created")
        )
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(result.message || "Failed to save period")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingPeriod
              ? dict.editPeriod || "Edit Period"
              : dict.addPeriod || "Add Period"}
          </DialogTitle>
          <DialogDescription>
            {dict.periodFormDescription ||
              "Configure a daily class period with start and end times."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("yearId")} />

          <div className="space-y-2">
            <Label htmlFor="name">{dict.periodName || "Period Name"}</Label>
            <Input
              id="name"
              placeholder="Period 1"
              {...register("name")}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">
                {dict.startTime || "Start Time"}
              </Label>
              <Input
                id="startTime"
                type="time"
                {...register("startTime")}
                className={errors.startTime ? "border-destructive" : ""}
              />
              {errors.startTime && (
                <p className="text-destructive text-xs">
                  {errors.startTime.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">{dict.endTime || "End Time"}</Label>
              <Input
                id="endTime"
                type="time"
                {...register("endTime")}
                className={errors.endTime ? "border-destructive" : ""}
              />
              {errors.endTime && (
                <p className="text-destructive text-xs">
                  {errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {dict.cancel || "Cancel"}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Icons.loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingPeriod
                ? dict.saveChanges || "Save Changes"
                : dict.addPeriod || "Add Period"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
