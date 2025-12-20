"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Palette, Upload } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { updateSchoolBranding } from "./actions"
import { brandingSchema, type BrandingFormData } from "./validation"

interface BrandingFormProps {
  schoolId: string
  initialData?: Partial<BrandingFormData>
  onSuccess?: () => void
}

export function BrandingForm({
  schoolId,
  initialData,
  onSuccess,
}: BrandingFormProps) {
  const { dictionary } = useDictionary()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>("")

  const form = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      logoUrl: initialData?.logoUrl || "",
      primaryColor: initialData?.primaryColor || "#000000",
      secondaryColor: initialData?.secondaryColor || "#ffffff",
      brandName: initialData?.brandName || "",
      tagline: initialData?.tagline || "",
    },
  })

  const handleSubmit = (data: BrandingFormData) => {
    startTransition(async () => {
      try {
        setError("")
        const result = await updateSchoolBranding(schoolId, data)

        if (result.success) {
          onSuccess?.()
        } else {
          setError(result.error || "Failed to update branding")
          if (result.errors) {
            Object.entries(result.errors).forEach(([field, message]) => {
              form.setError(field as keyof BrandingFormData, { message })
            })
          }
        }
      } catch (err) {
        setError("An unexpected error occurred")
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <div className="muted text-destructive bg-destructive/10 rounded-md p-3">
            {error}
          </div>
        )}

        <FormField
          control={form.control}
          name="brandName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {dictionary?.marketing?.onboarding?.branding?.brandName ||
                  "School Brand Name"}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={
                    dictionary?.marketing?.onboarding?.branding
                      ?.brandNamePlaceholder || "e.g., Al-Azhar Academy"
                  }
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tagline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {dictionary?.marketing?.onboarding?.branding?.tagline ||
                  "Tagline (Optional)"}
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={
                    dictionary?.marketing?.onboarding?.branding
                      ?.taglinePlaceholder || "e.g., Excellence in Education"
                  }
                  disabled={isPending}
                  rows={2}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {dictionary?.marketing?.onboarding?.branding?.logo ||
                  "School Logo (Optional)"}
              </FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      {...field}
                      placeholder={
                        dictionary?.marketing?.onboarding?.branding
                          ?.logoPlaceholder || "https://example.com/logo.png"
                      }
                      disabled={isPending}
                    />
                    <label htmlFor="logo-upload">
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/svg+xml,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return

                          // Show uploading state
                          setError("")

                          try {
                            const formData = new FormData()
                            formData.append("file", file)
                            formData.append("type", "logo")

                            const response = await fetch("/api/upload", {
                              method: "POST",
                              body: formData,
                            })

                            const data = await response.json()

                            if (data.success) {
                              form.setValue("logoUrl", data.url)
                            } else {
                              setError(data.error || "Failed to upload logo")
                            }
                          } catch (err) {
                            setError("Failed to upload logo")
                          }
                        }}
                        disabled={isPending}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4" />
                        </span>
                      </Button>
                    </label>
                  </div>
                  {field.value && (
                    <div className="relative h-24 w-24 overflow-hidden rounded-lg border">
                      <img
                        src={field.value}
                        alt="School logo"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="primaryColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {dictionary?.marketing?.onboarding?.branding?.primaryColor ||
                    "Primary Color"}
                </FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      {...field}
                      type="color"
                      className="h-10 w-12 rounded border p-1"
                      disabled={isPending}
                    />
                    <Input
                      {...field}
                      placeholder="#000000"
                      disabled={isPending}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="secondaryColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {dictionary?.marketing?.onboarding?.branding
                    ?.secondaryColor || "Secondary Color"}
                </FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      {...field}
                      type="color"
                      className="h-10 w-12 rounded border p-1"
                      disabled={isPending}
                    />
                    <Input
                      {...field}
                      placeholder="#ffffff"
                      disabled={isPending}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending
            ? dictionary?.marketing?.onboarding?.branding?.updating ||
              "Updating..."
            : dictionary?.marketing?.onboarding?.branding?.updateBranding ||
              "Update Branding"}
        </Button>
      </form>
    </Form>
  )
}
