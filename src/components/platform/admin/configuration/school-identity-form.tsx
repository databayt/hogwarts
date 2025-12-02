"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { MapPin, Mail, Phone, Globe, Pencil, Check, X, Loader2, Clock } from "lucide-react"
import { updateSchoolIdentity } from "./actions"
import type { Locale } from "@/components/internationalization/config"

const schoolIdentitySchema = z.object({
  name: z.string().min(2, "School name must be at least 2 characters"),
  domain: z.string().min(2, "Subdomain must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  timezone: z.string().optional(),
})

type SchoolIdentityFormData = z.infer<typeof schoolIdentitySchema>

interface Props {
  schoolId: string
  initialData: SchoolIdentityFormData
  lang: Locale
}

export function SchoolIdentityForm({ schoolId, initialData, lang }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>("")

  const form = useForm<SchoolIdentityFormData>({
    resolver: zodResolver(schoolIdentitySchema),
    defaultValues: initialData,
  })

  const handleSave = () => {
    const data = form.getValues()

    startTransition(async () => {
      try {
        setError("")
        const result = await updateSchoolIdentity(schoolId, data)

        if (result.success) {
          setIsEditing(false)
        } else {
          setError(result.error || "Failed to update school information")
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
          <div className="space-y-4 flex-1">
            {/* School Name Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">School Name</Label>
                <p className="font-medium">{initialData.name || "Not set"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Timezone</Label>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{initialData.timezone || "Africa/Khartoum"}</p>
                </div>
              </div>
            </div>

            {/* Subdomain */}
            <div>
              <Label className="text-xs text-muted-foreground">School URL</Label>
              <div className="flex items-center gap-1">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium font-mono text-sm">
                  {initialData.domain ? `${initialData.domain}.databayt.org` : "Not set"}
                </p>
              </div>
            </div>

            <Separator />

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{initialData.email || "Not set"}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{initialData.phoneNumber || "Not set"}</p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <Label className="text-xs text-muted-foreground">Address</Label>
              <div className="flex items-start gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="font-medium">{initialData.address || "Not set"}</p>
              </div>
            </div>

            {/* Website */}
            {initialData.website && (
              <div>
                <Label className="text-xs text-muted-foreground">Website</Label>
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a href={initialData.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {initialData.website}
                  </a>
                </div>
              </div>
            )}
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

      {/* School Name & Timezone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">School Name</Label>
          <Input
            id="name"
            {...form.register("name")}
            placeholder="Al-Azhar International School"
            disabled={isPending}
          />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            {...form.register("timezone")}
            placeholder="Africa/Khartoum"
            disabled={isPending}
          />
        </div>
      </div>

      {/* Subdomain */}
      <div className="space-y-2">
        <Label htmlFor="domain">School Subdomain</Label>
        <div className="flex items-center">
          <Input
            id="domain"
            {...form.register("domain")}
            placeholder="your-school"
            className="rounded-r-none"
            disabled={isPending}
          />
          <span className="px-3 py-2 bg-muted text-muted-foreground border border-l-0 rounded-r-md text-sm">
            .databayt.org
          </span>
        </div>
        {form.formState.errors.domain && (
          <p className="text-xs text-destructive">{form.formState.errors.domain.message}</p>
        )}
      </div>

      <Separator />

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            placeholder="info@school.edu"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone</Label>
          <Input
            id="phoneNumber"
            {...form.register("phoneNumber")}
            placeholder="+1 234 567 8900"
            disabled={isPending}
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          {...form.register("address")}
          placeholder="123 Education Street, Cairo, Egypt"
          disabled={isPending}
        />
      </div>

      {/* Website */}
      <div className="space-y-2">
        <Label htmlFor="website">Website (Optional)</Label>
        <Input
          id="website"
          {...form.register("website")}
          placeholder="https://www.school.edu"
          disabled={isPending}
        />
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
