"use client"

import * as React from "react"
import { Mail, RefreshCw } from "lucide-react"
import { useFormContext } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { FormStepContainer, FormStepHeader } from "@/components/form"

import { resendVerificationCode, sendVerificationCode } from "../actions"
import { NEWCOMER_STEPS } from "../config"

/**
 * Email Verification Step
 *
 * Third step of newcomers onboarding.
 * Sends and verifies 6-digit code via email.
 */
export function VerifyStep() {
  const form = useFormContext()
  const stepConfig = NEWCOMER_STEPS[2]
  const [isResending, setIsResending] = React.useState(false)
  const [codeSent, setCodeSent] = React.useState(false)
  const [countdown, setCountdown] = React.useState(0)

  const email = form.watch("email")

  // Send verification code on mount
  React.useEffect(() => {
    if (email && !codeSent) {
      handleSendCode()
    }
  }, [email])

  // Countdown timer for resend
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendCode = async () => {
    if (!email) return

    setIsResending(true)
    try {
      const result = await sendVerificationCode(email)
      if (result.success) {
        setCodeSent(true)
        setCountdown(60) // 60 second cooldown
        toast.success("Verification code sent to your email")
      } else {
        toast.error(result.error || "Failed to send code")
      }
    } catch (error) {
      toast.error("Failed to send verification code")
    } finally {
      setIsResending(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return

    setIsResending(true)
    try {
      const result = await resendVerificationCode(email)
      if (result.success) {
        setCountdown(60)
        toast.success("New verification code sent")
      } else {
        toast.error(result.error || "Failed to resend code")
      }
    } catch (error) {
      toast.error("Failed to resend verification code")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <FormStepContainer maxWidth="sm">
      <FormStepHeader
        stepNumber={3}
        totalSteps={5}
        title={stepConfig?.title || "Verify Email"}
        description={stepConfig?.description}
        icon={Mail}
        showStepIndicator={false}
      />

      <div className="space-y-6 text-center">
        <div className="bg-muted/50 mx-auto w-fit rounded-lg p-4">
          <p className="text-muted-foreground text-sm">
            We sent a 6-digit code to
          </p>
          <p className="font-medium">{email}</p>
        </div>

        <FormField
          control={form.control}
          name="verificationCode"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormLabel className="sr-only">Verification Code</FormLabel>
              <FormControl>
                <InputOTP
                  maxLength={6}
                  value={field.value}
                  onChange={field.onChange}
                  className="justify-center"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormDescription>
                Enter the 6-digit code from your email
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={isResending || countdown > 0}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`}
            />
            {countdown > 0
              ? `Resend in ${countdown}s`
              : isResending
                ? "Sending..."
                : "Resend code"}
          </Button>
        </div>
      </div>
    </FormStepContainer>
  )
}
