"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { MapPin, Pencil } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"

import { updateSchoolLocation } from "./actions"

const locationSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
})

type LocationFormData = z.infer<typeof locationSchema>

interface Props {
  schoolId: string
  initialData: LocationFormData
  lang: Locale
}

export function SchoolLocationForm({ schoolId, initialData, lang }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>("")

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: initialData,
  })

  const handleSave = () => {
    const data = form.getValues()

    startTransition(async () => {
      try {
        setError("")
        const result = await updateSchoolLocation(schoolId, data)

        if (result.success) {
          setIsEditing(false)
        } else {
          setError(result.error || "Failed to update location")
        }
      } catch {
        setError("An unexpected error occurred")
      }
    })
  }

  const handleCancel = () => {
    form.reset(initialData)
    setIsEditing(false)
    setError("")
  }

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label className="text-muted-foreground text-xs">City</Label>
                <div className="flex items-center gap-1">
                  <MapPin className="text-muted-foreground h-4 w-4" />
                  <p className="font-medium">{initialData.city || "Not set"}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">State</Label>
                <p className="font-medium">{initialData.state || "Not set"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Country</Label>
                <p className="font-medium">
                  {initialData.country || "Not set"}
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-1"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            {...form.register("city")}
            placeholder="Khartoum"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State / Province</Label>
          <Input
            id="state"
            {...form.register("state")}
            placeholder="Khartoum State"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            {...form.register("country")}
            placeholder="Sudan"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button onClick={handleSave} disabled={isPending} size="sm">
          {isPending ? (
            <>
              <Icons.loader2 className="me-1 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Icons.check className="me-1 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={handleCancel}
          disabled={isPending}
          size="sm"
        >
          <Icons.x className="me-1 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
