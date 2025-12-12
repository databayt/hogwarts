"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil, Check, X, Loader2, Upload } from "lucide-react"
import { updateSchoolBranding } from "./actions"
import type { Locale } from "@/components/internationalization/config"

const brandingSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color").optional().or(z.literal("")),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color").optional().or(z.literal("")),
  borderRadius: z.string().optional(),
})

type BrandingFormData = z.infer<typeof brandingSchema>

interface Props {
  schoolId: string
  initialData: BrandingFormData
  lang: Locale
}

const borderRadiusOptions = [
  { value: "none", label: "None (0px)" },
  { value: "sm", label: "Small (2px)" },
  { value: "md", label: "Medium (6px)" },
  { value: "lg", label: "Large (8px)" },
  { value: "xl", label: "Extra Large (12px)" },
  { value: "full", label: "Full (9999px)" },
]

export function BrandingSection({ schoolId, initialData, lang }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>("")

  const form = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: initialData,
  })

  const handleSave = () => {
    const data = form.getValues()

    startTransition(async () => {
      try {
        setError("")
        const result = await updateSchoolBranding(schoolId, data)

        if (result.success) {
          setIsEditing(false)
        } else {
          setError(result.error || "Failed to update branding")
        }
      } catch (err) {
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
    // Display mode
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              {initialData.logoUrl ? (
                <div className="w-16 h-16 rounded-lg border overflow-hidden bg-muted">
                  <img
                    src={initialData.logoUrl}
                    alt="School logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg border bg-muted flex items-center justify-center text-muted-foreground">
                  <Upload className="h-6 w-6" />
                </div>
              )}
            </div>

            {/* Colors Preview */}
            <div className="flex-1 space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Brand Colors</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-8 h-8 rounded border shadow-sm"
                    style={{ backgroundColor: initialData.primaryColor || '#3b82f6' }}
                    title={`Primary: ${initialData.primaryColor || '#3b82f6'}`}
                  />
                  <div
                    className="w-8 h-8 rounded border shadow-sm"
                    style={{ backgroundColor: initialData.secondaryColor || '#1e40af' }}
                    title={`Secondary: ${initialData.secondaryColor || '#1e40af'}`}
                  />
                  <span className="text-xs text-muted-foreground font-mono ml-1">
                    {initialData.primaryColor || '#3b82f6'} / {initialData.secondaryColor || '#1e40af'}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Border Radius</Label>
                <p className="text-sm">
                  {borderRadiusOptions.find(o => o.value === initialData.borderRadius)?.label || 'Medium (6px)'}
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

  // Edit mode
  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Logo URL */}
      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL (Updates School Logo)</Label>
        <div className="flex gap-2">
          <Input
            id="logoUrl"
            {...form.register("logoUrl")}
            placeholder="https://example.com/logo.png"
            disabled={isPending}
            className="flex-1"
          />
          {form.watch("logoUrl") && (
            <div className="w-10 h-10 rounded border overflow-hidden bg-muted flex-shrink-0">
              <img
                src={form.watch("logoUrl")}
                alt="Preview"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none"
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primaryColor">Primary Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              {...form.register("primaryColor")}
              className="w-12 h-10 p-1 cursor-pointer"
              disabled={isPending}
            />
            <Input
              {...form.register("primaryColor")}
              placeholder="#3b82f6"
              disabled={isPending}
              className="flex-1 font-mono"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="secondaryColor">Secondary Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              {...form.register("secondaryColor")}
              className="w-12 h-10 p-1 cursor-pointer"
              disabled={isPending}
            />
            <Input
              {...form.register("secondaryColor")}
              placeholder="#1e40af"
              disabled={isPending}
              className="flex-1 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Border Radius */}
      <div className="space-y-2">
        <Label htmlFor="borderRadius">Border Radius</Label>
        <Select
          value={form.watch("borderRadius") || "md"}
          onValueChange={(value) => form.setValue("borderRadius", value)}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select border radius" />
          </SelectTrigger>
          <SelectContent>
            {borderRadiusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Button onClick={handleSave} disabled={isPending} size="sm">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-1" />
              Save Changes
            </>
          )}
        </Button>
        <Button variant="ghost" onClick={handleCancel} disabled={isPending} size="sm">
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
