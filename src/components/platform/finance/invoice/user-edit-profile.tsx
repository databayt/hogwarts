"use client"

import { useState } from "react"
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
import { onboardingSchema } from "@/components/platform/finance/invoice/validation"

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      currency: currency ?? "USD",
    },
  })

  const onSubmit = async (data: z.infer<typeof onboardingSchema>) => {
    try {
      setIsLoading(true)
      const mod = await import("@/components/platform/finance/invoice/actions")
      const res = await mod.updateUser(data)
      if (res.success) {
        SuccessToast("Profile updated successfully")
      } else {
        ErrorToast(res.error || "Failed to update profile")
      }
    } catch (error) {
      ErrorToast("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <Label>Email</Label>
        <Input value={email ?? ""} disabled readOnly />
      </div>
      <div className="grid gap-2">
        <Label>First Name</Label>
        <Input
          placeholder="Joe"
          type="text"
          disabled={isLoading}
          {...register("firstName", { required: true })}
        />
      </div>
      <div className="grid gap-2">
        <Label>Last Name</Label>
        <Input
          placeholder="Doe"
          type="text"
          disabled={isLoading}
          {...register("lastName", { required: true })}
        />
      </div>
      <div className="grid gap-2">
        <Label>Currency</Label>
        <Select
          defaultValue={currency ?? "USD"}
          {...register("currency")}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select currency" />
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
        {isLoading ? "Saving..." : "Save changes"}
      </Button>
    </form>
  )
}
