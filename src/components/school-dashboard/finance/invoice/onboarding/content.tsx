"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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
import { useDictionary } from "@/components/internationalization/use-dictionary"
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
  const { dictionary } = useDictionary()
  const io = (dictionary as any)?.finance?.invoiceOnboarding as
    | Record<string, string>
    | undefined

  const onSubmit = async (data: z.infer<typeof onboardingSchema>) => {
    try {
      setIsLoading(true)
      const res =
        await import("@/components/school-dashboard/finance/invoice/actions")
      const response = await res.updateUser(data)
      if (response.success) {
        SuccessToast(
          io?.onboardingCompleted || "Onboarding completed successfully"
        )
        router.push("/dashboard")
      } else {
        ErrorToast(
          response.error ||
            io?.failedUpdateProfile ||
            "Failed to update profile"
        )
      }
    } catch (error) {
      ErrorToast(io?.somethingWentWrong || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{io?.almostFinished || "You are almost finished"}</CardTitle>
        <CardDescription>
          {io?.enterInfo || "Enter your information to create an account."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <Label>{io?.firstName || "First Name"}</Label>
            <Input
              placeholder={io?.firstName || "Joe"}
              type="text"
              {...register("firstName", { required: true })}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label>{io?.lastName || "Last Name"}</Label>
            <Input
              placeholder={io?.lastName || "Due"}
              type="text"
              {...register("lastName", { required: true })}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label>{io?.selectCurrency || "Select Currency"}</Label>
            <Select
              defaultValue="USD"
              {...register("currency")}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    io?.selectCurrencyPlaceholder || "Select currency"
                  }
                />
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
            {isLoading
              ? io?.pleaseWait || "Please wait..."
              : io?.finishOnboarding || "Finish onboarding"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default OnboardingContent
