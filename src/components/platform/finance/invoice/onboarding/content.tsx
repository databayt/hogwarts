"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { currencyOption } from "@/lib/utils"
import { onboardingSchema } from "@/components/platform/finance/invoice/validation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"

export function OnboardingContent() {
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { currency: "USD" },
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter()

  const onSubmit = async (data: z.infer<typeof onboardingSchema>) => {
    try {
      setIsLoading(true)
      const res = await import("@/components/platform/finance/invoice/actions")
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
    <div className="flex justify-center items-center flex-col min-h-dvh h-dvh overflow-auto relative p-4">
      <div className="absolute top-0 z-[-2] h-screen w-screen bg-white bg-[radial-gradient(100%_50%_at_50%_0%,rgba(140,0,255,0.13)_0,rgba(140,0,255,0)_50%,rgba(140,0,255,0)_100%)]"></div>
      <div className="absolute h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

      <Card className="min-w-xs lg:min-w-sm w-full max-w-sm relative z-10">
        <CardHeader>
          <CardTitle>You are almost finished</CardTitle>
          <CardDescription>Enter your information to create an account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-2">
              <Label>First Name</Label>
              <Input placeholder="Joe" type="text" {...register("firstName", { required: true })} disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label>Last Name</Label>
              <Input placeholder="Due" type="text" {...register("lastName", { required: true })} disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label>Select Currency</Label>
              <Select defaultValue="USD" {...register("currency")} disabled={isLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(currencyOption).map((item: string) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button disabled={isLoading}>{isLoading ? "Please wait..." : "Finish onboarding"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default OnboardingContent


