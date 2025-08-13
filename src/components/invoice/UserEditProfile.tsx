"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { onboardingSchema } from "@/components/invoice/validation"
import { currencyOption } from "@/lib/utils"
import { toast } from "sonner"

interface UserEditProfileProps {
  firstName?: string
  lastName?: string
  currency?: string
  email?: string
}

export default function UserEditProfile({ firstName, lastName, currency, email }: UserEditProfileProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof onboardingSchema>>({
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
      const mod = await import("@/components/invoice/actions")
      const res = await mod.updateUser(data)
      if (res.success) {
        toast.success("Profile updated")
      } else {
        toast.error(res.error || "Failed to update profile")
      }
    } catch (error) {
      toast.error("Something went wrong")
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
        <Input placeholder="Joe" type="text" disabled={isLoading} {...register("firstName", { required: true })} />
        {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
      </div>
      <div className="grid gap-2">
        <Label>Last Name</Label>
        <Input placeholder="Doe" type="text" disabled={isLoading} {...register("lastName", { required: true })} />
        {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
      </div>
      <div className="grid gap-2">
        <Label>Currency</Label>
        <Select defaultValue={currency ?? "USD"} {...register("currency")} disabled={isLoading}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(currencyOption).map((code) => (
              <SelectItem key={code} value={code}>{code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save changes"}</Button>
    </form>
  )
}

