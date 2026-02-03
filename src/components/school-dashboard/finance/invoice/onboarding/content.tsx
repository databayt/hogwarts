"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { currencyOption } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { onboardingSchema } from "@/components/school-dashboard/finance/invoice/validation"

export function OnboardingContent() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { currency: "USD" },
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter()

  const onSubmit = async (data: z.infer<typeof onboardingSchema>) => {
    try {
      setIsLoading(true)
      const res =
        await import("@/components/school-dashboard/finance/invoice/actions")
      const response = await res.updateUser(data)
      if (response.success) {
        SuccessToast("Onboarding completed successfully")
        router.push("/dashboard")
      } else {
        ErrorToast(response.error || "Failed to update profile")
      }
    } catch (error) {
      ErrorToast("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>You are almost finished</CardTitle>
        <CardDescription>
          Enter your information to create an account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <Label>First Name</Label>
            <Input
              placeholder="Joe"
              type="text"
              {...register("firstName", { required: true })}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label>Last Name</Label>
            <Input
              placeholder="Due"
              type="text"
              {...register("lastName", { required: true })}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label>Select Currency</Label>
            <Select
              defaultValue="USD"
              {...register("currency")}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(currencyOption).map((item: string) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button disabled={isLoading}>
            {isLoading ? "Please wait..." : "Finish onboarding"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default OnboardingContent
