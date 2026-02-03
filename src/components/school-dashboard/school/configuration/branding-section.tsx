"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Loader2, Pencil, Upload, X } from "lucide-react"
import { useForm } from "react-hook-form"
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
import type { Locale } from "@/components/internationalization/config"

import { updateSchoolBranding } from "./actions"

const brandingSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid color")
    .optional()
    .or(z.literal("")),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid color")
    .optional()
    .or(z.literal("")),
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
          <div className="flex flex-1 items-center gap-4">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              {initialData.logoUrl ? (
                <div className="bg-muted h-16 w-16 overflow-hidden rounded-lg border">
                  <img
                    src={initialData.logoUrl}
                    alt="School logo"
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="bg-muted text-muted-foreground flex h-16 w-16 items-center justify-center rounded-lg border">
                  <Upload className="h-6 w-6" />
                </div>
              )}
            </div>

            {/* Colors Preview */}
            <div className="flex-1 space-y-2">
              <div>
                <Label className="text-muted-foreground text-xs">
                  Brand Colors
                </Label>
                <div className="mt-1 flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded border shadow-sm"
                    style={{
                      backgroundColor: initialData.primaryColor || "#3b82f6",
                    }}
                    title={`Primary: ${initialData.primaryColor || "#3b82f6"}`}
                  />
                  <div
                    className="h-8 w-8 rounded border shadow-sm"
                    style={{
                      backgroundColor: initialData.secondaryColor || "#1e40af",
                    }}
                    title={`Secondary: ${initialData.secondaryColor || "#1e40af"}`}
                  />
                  <span className="text-muted-foreground ml-1 font-mono text-xs">
                    {initialData.primaryColor || "#3b82f6"} /{" "}
                    {initialData.secondaryColor || "#1e40af"}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">
                  Border Radius
                </Label>
                <p className="text-sm">
                  {borderRadiusOptions.find(
                    (o) => o.value === initialData.borderRadius
                  )?.label || "Medium (6px)"}
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
        <div className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
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
            <div className="bg-muted h-10 w-10 flex-shrink-0 overflow-hidden rounded border">
              <img
                src={form.watch("logoUrl")}
                alt="Preview"
                className="h-full w-full object-contain"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = "none"
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
              className="h-10 w-12 cursor-pointer p-1"
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
              className="h-10 w-12 cursor-pointer p-1"
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
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-1 h-4 w-4" />
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
          <X className="mr-1 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
