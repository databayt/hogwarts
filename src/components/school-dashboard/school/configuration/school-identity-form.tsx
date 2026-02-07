"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Phone } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"

import { updateSchoolIdentity } from "./actions"

const schoolIdentitySchema = z.object({
  name: z.string().min(2, "School name must be at least 2 characters"),
  domain: z
    .string()
    .min(2, "Subdomain must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  timezone: z.string().optional(),
  description: z.string().optional(),
  schoolType: z.string().optional(),
  schoolLevel: z.string().optional(),
})

const SCHOOL_TYPES = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
  { value: "international", label: "International" },
  { value: "technical", label: "Technical" },
  { value: "special", label: "Special Education" },
]

const SCHOOL_LEVELS = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "both", label: "Both (K-12)" },
]

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
          <div className="flex-1 space-y-4">
            {/* School Name Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground text-xs">
                  School Name
                </Label>
                <p className="font-medium">{initialData.name || "Not set"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">
                  Timezone
                </Label>
                <div className="flex items-center gap-1">
                  <Icons.clock className="text-muted-foreground h-4 w-4" />
                  <p className="font-medium">
                    {initialData.timezone || "Africa/Khartoum"}
                  </p>
                </div>
              </div>
            </div>

            {/* Subdomain */}
            <div>
              <Label className="text-muted-foreground text-xs">
                School URL
              </Label>
              <div className="flex items-center gap-1">
                <Icons.globe className="text-muted-foreground h-4 w-4" />
                <p className="font-mono text-sm font-medium">
                  {initialData.domain
                    ? `${initialData.domain}.databayt.org`
                    : "Not set"}
                </p>
              </div>
            </div>

            <Separator />

            {/* Contact Info */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground text-xs">Email</Label>
                <div className="flex items-center gap-1">
                  <Icons.mail className="text-muted-foreground h-4 w-4" />
                  <p className="font-medium">
                    {initialData.email || "Not set"}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Phone</Label>
                <div className="flex items-center gap-1">
                  <Phone className="text-muted-foreground h-4 w-4" />
                  <p className="font-medium">
                    {initialData.phoneNumber || "Not set"}
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <Label className="text-muted-foreground text-xs">Address</Label>
              <div className="flex items-start gap-1">
                <Icons.mapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
                <p className="font-medium">
                  {initialData.address || "Not set"}
                </p>
              </div>
            </div>

            {/* Website */}
            {initialData.website && (
              <div>
                <Label className="text-muted-foreground text-xs">Website</Label>
                <div className="flex items-center gap-1">
                  <Icons.globe className="text-muted-foreground h-4 w-4" />
                  <a
                    href={initialData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium hover:underline"
                  >
                    {initialData.website}
                  </a>
                </div>
              </div>
            )}

            <Separator />

            {/* School Classification */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground text-xs">
                  School Type
                </Label>
                <p className="font-medium capitalize">
                  {initialData.schoolType
                    ? SCHOOL_TYPES.find(
                        (t) => t.value === initialData.schoolType
                      )?.label || initialData.schoolType
                    : "Not set"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">
                  School Level
                </Label>
                <p className="font-medium capitalize">
                  {initialData.schoolLevel
                    ? SCHOOL_LEVELS.find(
                        (l) => l.value === initialData.schoolLevel
                      )?.label || initialData.schoolLevel
                    : "Not set"}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-muted-foreground text-xs">
                Description
              </Label>
              <p className="text-muted-foreground text-sm">
                {initialData.description || "Not set"}
              </p>
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

      {/* School Name & Timezone */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">School Name</Label>
          <Input
            id="name"
            {...form.register("name")}
            placeholder="Al-Azhar International School"
            disabled={isPending}
          />
          {form.formState.errors.name && (
            <p className="text-destructive text-xs">
              {form.formState.errors.name.message}
            </p>
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
            className="rounded-e-none"
            disabled={isPending}
          />
          <span className="bg-muted text-muted-foreground rounded-e-md border border-s-0 px-3 py-2 text-sm">
            .databayt.org
          </span>
        </div>
        {form.formState.errors.domain && (
          <p className="text-destructive text-xs">
            {form.formState.errors.domain.message}
          </p>
        )}
      </div>

      <Separator />

      {/* Contact Info */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

      <Separator />

      {/* School Classification */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="schoolType">School Type</Label>
          <Select
            value={form.watch("schoolType") || ""}
            onValueChange={(value) => form.setValue("schoolType", value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {SCHOOL_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="schoolLevel">School Level</Label>
          <Select
            value={form.watch("schoolLevel") || ""}
            onValueChange={(value) => form.setValue("schoolLevel", value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {SCHOOL_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="Brief description of your school..."
          rows={3}
          disabled={isPending}
        />
      </div>

      {/* Actions */}
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
