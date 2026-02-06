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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Icons } from "@/components/icons"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { createTerm, updateTerm } from "./actions"
import type { Term } from "./types"
import { createTermSchema } from "./validation"

interface TermFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  yearId: string
  editingTerm?: Term | null
  existingTermNumbers: number[]
  onSuccess: () => void
  dictionary?: Dictionary
}

export function TermForm({
  open,
  onOpenChange,
  yearId,
  editingTerm,
  existingTermNumbers,
  onSuccess,
  dictionary,
}: TermFormProps) {
  // Academic dictionary - fallback to empty for now
  const dict =
    ((dictionary?.school as Record<string, unknown>)?.academic as
      | Record<string, string>
      | undefined) ?? {}
  const [isPending, setIsPending] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createTermSchema),
    defaultValues: editingTerm
      ? {
          yearId,
          termNumber: editingTerm.termNumber.toString(),
          startDate: new Date(editingTerm.startDate)
            .toISOString()
            .split("T")[0],
          endDate: new Date(editingTerm.endDate).toISOString().split("T")[0],
        }
      : {
          yearId,
          termNumber: "1",
          startDate: "",
          endDate: "",
        },
  })

  const termNumber = watch("termNumber")

  // Reset form when dialog opens/closes or editingTerm changes
  React.useEffect(() => {
    if (open) {
      if (editingTerm) {
        reset({
          yearId,
          termNumber: editingTerm.termNumber.toString(),
          startDate: new Date(editingTerm.startDate)
            .toISOString()
            .split("T")[0],
          endDate: new Date(editingTerm.endDate).toISOString().split("T")[0],
        })
      } else {
        // Find next available term number
        const nextTermNumber =
          [1, 2, 3, 4].find((n) => !existingTermNumbers.includes(n)) || 1
        reset({
          yearId,
          termNumber: nextTermNumber.toString(),
          startDate: "",
          endDate: "",
        })
      }
    }
  }, [editingTerm, open, reset, yearId, existingTermNumbers])

  const onSubmit = async (data: {
    yearId: string
    termNumber: string
    startDate: string
    endDate: string
  }) => {
    setIsPending(true)

    try {
      const formData = new FormData()
      formData.append("yearId", data.yearId)
      formData.append("termNumber", data.termNumber)
      formData.append("startDate", new Date(data.startDate).toISOString())
      formData.append("endDate", new Date(data.endDate).toISOString())

      let result
      if (editingTerm) {
        formData.append("id", editingTerm.id)
        result = await updateTerm(formData)
      } else {
        result = await createTerm(formData)
      }

      if (result.success) {
        toast.success(
          result.message || (editingTerm ? "Term updated" : "Term created")
        )
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(result.message || "Failed to save term")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsPending(false)
    }
  }

  // Available term numbers (1-4, excluding existing ones unless editing)
  const availableTermNumbers = [1, 2, 3, 4].filter(
    (n) =>
      !existingTermNumbers.includes(n) ||
      (editingTerm && n === editingTerm.termNumber)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingTerm
              ? dict.editTerm || "Edit Term"
              : dict.addTerm || "Add Term"}
          </DialogTitle>
          <DialogDescription>
            {dict.termFormDescription ||
              "Configure term dates within the academic year."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(
            onSubmit as unknown as Parameters<typeof handleSubmit>[0]
          )}
          className="space-y-4"
        >
          <input type="hidden" {...register("yearId")} />

          <div className="space-y-2">
            <Label htmlFor="termNumber">
              {dict.termNumber || "Term Number"}
            </Label>
            <Select
              value={termNumber as string}
              onValueChange={(value) => setValue("termNumber", value)}
            >
              <SelectTrigger
                className={errors.termNumber ? "border-destructive" : ""}
              >
                <SelectValue placeholder={dict.selectTerm || "Select term"} />
              </SelectTrigger>
              <SelectContent>
                {availableTermNumbers.map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {dict.term || "Term"} {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.termNumber && (
              <p className="text-destructive text-xs">
                {errors.termNumber.message}
              </p>
            )}
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
                <p className="text-destructive text-xs">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">{dict.endDate || "End Date"}</Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
                className={errors.endDate ? "border-destructive" : ""}
              />
              {errors.endDate && (
                <p className="text-destructive text-xs">
                  {errors.endDate.message}
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
                <Icons.loader2 className="me-2 h-4 w-4 animate-spin" />
              )}
              {editingTerm
                ? dict.saveChanges || "Save Changes"
                : dict.addTerm || "Add Term"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
