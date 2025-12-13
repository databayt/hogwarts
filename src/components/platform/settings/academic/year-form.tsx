"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createSchoolYearSchema } from "./validation"
import { createSchoolYear, updateSchoolYear } from "./actions"
import type { SchoolYear } from "./types"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface YearFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingYear?: SchoolYear | null
  onSuccess: () => void
  dictionary?: Dictionary
}

export function YearForm({
  open,
  onOpenChange,
  editingYear,
  onSuccess,
  dictionary,
}: YearFormProps) {
  // Academic dictionary - fallback to empty for now
  const dict = (dictionary?.school as Record<string, unknown>)?.academic as Record<string, string> | undefined ?? {}
  const [isPending, setIsPending] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createSchoolYearSchema),
    defaultValues: editingYear
      ? {
          yearName: editingYear.yearName,
          startDate: new Date(editingYear.startDate).toISOString().split("T")[0],
          endDate: new Date(editingYear.endDate).toISOString().split("T")[0],
        }
      : {
          yearName: "",
          startDate: "",
          endDate: "",
        },
  })

  // Reset form when editingYear changes
  React.useEffect(() => {
    if (open) {
      if (editingYear) {
        reset({
          yearName: editingYear.yearName,
          startDate: new Date(editingYear.startDate).toISOString().split("T")[0],
          endDate: new Date(editingYear.endDate).toISOString().split("T")[0],
        })
      } else {
        reset({
          yearName: "",
          startDate: "",
          endDate: "",
        })
      }
    }
  }, [editingYear, open, reset])

  const onSubmit = async (data: { yearName: string; startDate: string; endDate: string }) => {
    setIsPending(true)

    try {
      const formData = new FormData()
      formData.append("yearName", data.yearName)
      formData.append("startDate", new Date(data.startDate).toISOString())
      formData.append("endDate", new Date(data.endDate).toISOString())

      let result
      if (editingYear) {
        formData.append("id", editingYear.id)
        result = await updateSchoolYear(formData)
      } else {
        result = await createSchoolYear(formData)
      }

      if (result.success) {
        toast.success(result.message || (editingYear ? "Year updated" : "Year created"))
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(result.message || "Failed to save year")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsPending(false)
    }
  }

  // Generate suggested year name
  const currentYear = new Date().getFullYear()
  const suggestedYearName = `${currentYear}-${currentYear + 1}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingYear
              ? (dict.editYear || "Edit Academic Year")
              : (dict.addYear || "Add Academic Year")}
          </DialogTitle>
          <DialogDescription>
            {dict.yearFormDescription ||
              "Configure the academic year with start and end dates."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as unknown as Parameters<typeof handleSubmit>[0])} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="yearName">
              {dict.yearName || "Year Name"}
            </Label>
            <Input
              id="yearName"
              placeholder={suggestedYearName}
              {...register("yearName")}
              className={errors.yearName ? "border-destructive" : ""}
            />
            {errors.yearName && (
              <p className="text-xs text-destructive">{errors.yearName.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {dict.yearNameHint || "Format: YYYY-YYYY (e.g., 2024-2025)"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                {dict.startDate || "Start Date"}
              </Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                className={errors.startDate ? "border-destructive" : ""}
              />
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                {dict.endDate || "End Date"}
              </Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
                className={errors.endDate ? "border-destructive" : ""}
              />
              {errors.endDate && (
                <p className="text-xs text-destructive">{errors.endDate.message}</p>
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
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingYear
                ? (dict.saveChanges || "Save Changes")
                : (dict.addYear || "Add Year")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
