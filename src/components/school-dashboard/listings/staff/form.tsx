"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { Camera, Loader2 } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PhoneInput } from "@/components/atom/phone-input"
import { uploadFile } from "@/components/file"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { createStaff, updateStaff } from "./actions"
import {
  getEmploymentStatusOptions,
  getEmploymentTypeOptions,
  getGenderOptions,
} from "./config"
import { staffCreateSchema, type StaffCreateInput } from "./validation"

interface StaffFormProps {
  initialData?: Partial<StaffCreateInput> & { id?: string }
  departments?: Array<{ id: string; departmentName: string }>
  onSuccess?: () => void
  onCancel?: () => void
}

export function StaffForm({
  initialData,
  departments = [],
  onSuccess,
  onCancel,
}: StaffFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [avatarUrl, setAvatarUrl] = React.useState(
    initialData?.profilePhotoUrl || ""
  )
  const [isUploading, setIsUploading] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const isEdit = !!initialData?.id
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.staffListing as Record<string, any> | undefined
  const f = d?.form as Record<string, string> | undefined

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const result = await uploadFile(fd, {
        category: "image",
        folder: "avatars",
      })
      if (result.success) {
        setAvatarUrl(result.url)
        form.setValue("profilePhotoUrl", result.url)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const form = useForm<StaffCreateInput>({
    resolver: zodResolver(staffCreateSchema) as any,
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      emailAddress: initialData?.emailAddress || "",
      gender: initialData?.gender || undefined,
      position: initialData?.position || "",
      departmentId: initialData?.departmentId || undefined,
      employmentStatus: initialData?.employmentStatus || "ACTIVE",
      employmentType: initialData?.employmentType || "FULL_TIME",
      phoneNumber: initialData?.phoneNumber || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      emergencyContactName: initialData?.emergencyContactName || "",
      emergencyContactPhone: initialData?.emergencyContactPhone || "",
    },
  })

  async function onSubmit(data: StaffCreateInput) {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })

      if (isEdit && initialData?.id) {
        await updateStaff(initialData.id, formData)
      } else {
        await createStaff(formData)
      }

      onSuccess?.()
    } catch (error) {
      console.error("Failed to save staff:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const genderOptions = getGenderOptions(d)
  const statusOptions = getEmploymentStatusOptions(d)
  const typeOptions = getEmploymentTypeOptions(d)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative size-20 shrink-0 overflow-hidden rounded-full border"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={f?.photoAlt || "Photo"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="bg-muted flex size-full items-center justify-center">
                <Camera className="text-muted-foreground size-6" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <Camera className="size-5 text-white" />
            </div>
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="size-5 animate-spin text-white" />
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div>
            <p className="text-sm font-medium">
              {f?.profilePhoto || "Profile Photo"}
            </p>
            <p className="text-muted-foreground text-xs">
              {f?.clickToUpload || "Click to upload"}
            </p>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{f?.firstNameRequired || "First Name *"}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={f?.firstNamePlaceholder || "Enter first name"}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{f?.lastNameRequired || "Last Name *"}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={f?.lastNamePlaceholder || "Enter last name"}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="emailAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{f?.emailRequired || "Email *"}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={f?.emailPlaceholder || "Enter email"}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{f?.gender || "Gender"}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={f?.selectGender || "Select gender"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {genderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Position Information */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{f?.position || "Position"}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={f?.positionPlaceholder || "e.g., Accountant"}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{f?.department || "Department"}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={f?.selectDepartment || "Select department"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.departmentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="employmentStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {f?.employmentStatus || "Employment Status"}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={f?.selectStatus || "Select status"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
            name="employmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{f?.employmentType || "Employment Type"}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={f?.selectType || "Select type"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{f?.phoneNumber || "Phone Number"}</FormLabel>
                <FormControl>
                  <PhoneInput
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder={f?.phonePlaceholder || "Enter phone number"}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{f?.address || "Address"}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={f?.addressPlaceholder || "Enter address"}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Emergency Contact */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="emergencyContactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {f?.emergencyContactName || "Emergency Contact Name"}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      f?.emergencyContactNamePlaceholder || "Enter name"
                    }
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emergencyContactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {f?.emergencyContactPhone || "Emergency Contact Phone"}
                </FormLabel>
                <FormControl>
                  <PhoneInput
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder={
                      f?.emergencyContactPhonePlaceholder || "Enter phone"
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {f?.cancel || "Cancel"}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? f?.saving || "Saving..."
              : isEdit
                ? f?.update || "Update"
                : f?.create || "Create"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
