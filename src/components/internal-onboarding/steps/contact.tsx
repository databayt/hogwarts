"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
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
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { FormHeading } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import { useLocale } from "@/components/internationalization/use-locale"
import {
  sendVerificationCode,
  verifyEmailCode,
} from "@/components/onboarding/newcomers/actions"

import { STEP_META } from "../config"
import { useOnboarding } from "../use-onboarding"
import { contactSchema, type ContactSchemaType } from "../validation"

export function ContactStep() {
  const router = useRouter()
  const params = useParams()
  const { locale } = useLocale()
  const subdomain = params.subdomain as string

  const { state, schoolId, updateStepData } = useOnboarding()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()

  const initialData = state.formData.contact
  const autoFill = state.applicationData

  const [otpSent, setOtpSent] = useState(initialData?.emailVerified || false)
  const [otpVerified, setOtpVerified] = useState(
    initialData?.emailVerified || false
  )
  const [otpCode, setOtpCode] = useState("")
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)

  const form = useForm<ContactSchemaType>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: initialData?.email || autoFill?.email || "",
      emailVerified: initialData?.emailVerified || false,
      phone: initialData?.phone || autoFill?.phone || "",
      address: initialData?.address || autoFill?.address || "",
      city: initialData?.city || autoFill?.city || "",
      state: initialData?.state || autoFill?.state || "",
      country: initialData?.country || autoFill?.country || "",
      emergencyContactName: initialData?.emergencyContactName || "",
      emergencyContactPhone: initialData?.emergencyContactPhone || "",
      emergencyContactRelation: initialData?.emergencyContactRelation || "",
    },
  })

  // Sync form to context
  useEffect(() => {
    const subscription = form.watch((value) => {
      updateStepData("contact", value as ContactSchemaType)
    })
    return () => subscription.unsubscribe()
  }, [form, updateStepData])

  const handleSendOtp = useCallback(async () => {
    const email = form.getValues("email")
    if (!email) return
    setSending(true)
    setOtpError(null)
    const result = await sendVerificationCode(email, schoolId)
    setSending(false)
    if (result.success) {
      setOtpSent(true)
    } else {
      setOtpError(result.error || "Failed to send code")
    }
  }, [form, schoolId])

  const handleVerifyOtp = useCallback(async () => {
    const email = form.getValues("email")
    if (!email || !otpCode) return
    setVerifying(true)
    setOtpError(null)
    const result = await verifyEmailCode(email, otpCode)
    setVerifying(false)
    if (result.success) {
      setOtpVerified(true)
      form.setValue("emailVerified", true)
      updateStepData("contact", { ...form.getValues(), emailVerified: true })
    } else {
      setOtpError(result.error || "Invalid code")
    }
  }, [form, otpCode, updateStepData])

  // Validation + navigation
  useEffect(() => {
    const data = form.watch()
    const isValid = data.email && otpVerified

    if (isValid) {
      enableNext()
      setCustomNavigation({
        onNext: async () => {
          const valid = await form.trigger()
          if (valid) {
            updateStepData("contact", {
              ...form.getValues(),
              emailVerified: true,
            })
            router.push(`/${locale}/s/${subdomain}/join/role-details`)
          }
        },
      })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  })

  const meta = STEP_META.contact

  return (
    <div className="space-y-8">
      <FormHeading title={meta.title} description={meta.description} />

      <Form {...form}>
        <form className="space-y-6">
          {/* Email + Verification */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="your@email.com"
                        disabled={otpVerified}
                      />
                    </FormControl>
                    {!otpVerified && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendOtp}
                        disabled={!field.value || sending}
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : otpSent ? (
                          "Resend"
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    )}
                    {otpVerified && (
                      <span className="flex items-center text-sm text-green-600">
                        Verified
                      </span>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {otpSent && !otpVerified && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  Enter the 6-digit code sent to your email
                </p>
                <div className="flex items-center gap-3">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <Button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpCode.length !== 6 || verifying}
                  >
                    {verifying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Confirm"
                    )}
                  </Button>
                </div>
                {otpError && <p className="text-sm text-red-500">{otpError}</p>}
              </div>
            )}
          </div>

          {/* Phone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" placeholder="+1234567890" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Street address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="City" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="State" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Country" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="mb-4 font-medium">Emergency Contact</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="emergencyContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Contact name" />
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" placeholder="Phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergencyContactRelation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relation</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Spouse, Parent" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
