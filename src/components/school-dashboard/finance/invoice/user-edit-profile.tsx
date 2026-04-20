"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { currencyOption } from "@/lib/utils"
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
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import {
  createOnboardingSchema,
  onboardingSchema,
} from "@/components/school-dashboard/finance/invoice/validation"

interface UserEditProfileProps {
  firstName?: string
  lastName?: string
  currency?: string
  email?: string
}

export default function UserEditProfile({
  firstName,
  lastName,
  currency,
  email,
}: UserEditProfileProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { dictionary } = useDictionary()
  const ip = (dictionary as any)?.finance?.invoiceProfile as
    | Record<string, string>
    | undefined
  const schema = useMemo(
    () => (dictionary ? createOnboardingSchema(dictionary) : onboardingSchema),
    [dictionary]
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      currency: currency ?? "USD",
    },
  })

  const onSubmit = async (data: z.infer<typeof onboardingSchema>) => {
    try {
      setIsLoading(true)
      const mod =
        await import("@/components/school-dashboard/finance/invoice/actions")
      const res = await mod.updateUser(data)
      if (res.success) {
        SuccessToast(ip?.profileUpdated || "Profile updated successfully")
      } else {
        ErrorToast(
          res.error || ip?.failedUpdateProfile || "Failed to update profile"
        )
      }
    } catch (error) {
      ErrorToast(ip?.somethingWentWrong || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <Label>{ip?.email || "Email"}</Label>
        <Input value={email ?? ""} disabled readOnly />
      </div>
      <div className="grid gap-2">
        <Label>{ip?.firstName || "First Name"}</Label>
        <Input
          placeholder={ip?.firstName || "Joe"}
          type="text"
          disabled={isLoading}
          {...register("firstName", { required: true })}
        />
      </div>
      <div className="grid gap-2">
        <Label>{ip?.lastName || "Last Name"}</Label>
        <Input
          placeholder={ip?.lastName || "Doe"}
          type="text"
          disabled={isLoading}
          {...register("lastName", { required: true })}
        />
      </div>
      <div className="grid gap-2">
        <Label>{ip?.currency || "Currency"}</Label>
        <Select
          defaultValue={currency ?? "USD"}
          {...register("currency")}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={ip?.selectCurrency || "Select currency"}
            />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(currencyOption).map((code) => (
              <SelectItem key={code} value={code}>
                {code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading
          ? ip?.saving || "Saving..."
          : ip?.saveChanges || "Save changes"}
      </Button>
    </form>
  )
}
