"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

import { FormError } from "../error/form-error"
import { FormSuccess } from "../form-success"
import { Social } from "../social"
import { createRegisterSchema } from "../validation"
import {
  checkVerificationStatus,
  resendVerificationCode,
  verifyOTP,
} from "../verification/action"
import { register } from "./action"

interface Props extends React.ComponentPropsWithoutRef<"div"> {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!domain) return email
  const visible = local.slice(0, Math.min(2, local.length))
  return `${visible}${"*".repeat(Math.max(local.length - 2, 0))}@${domain}`
}

export const RegisterForm = (props: Props) => {
  const { dictionary, lang, className, ...rest } = props
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl")

  const [mode, setMode] = useState<"register" | "verify">("register")
  const [verifyEmail, setVerifyEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | undefined>("")
  const [success, setSuccess] = useState<string | undefined>("")
  const [isPending, startTransition] = useTransition()
  const [otpValue, setOtpValue] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Create localized schema (memoized)
  const RegisterSchema = useMemo(
    () => createRegisterSchema(dictionary),
    [dictionary]
  )

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      username: "",
    },
  })

  // Auto-login helper
  const autoLogin = useCallback(
    async (email: string, pwd: string) => {
      try {
        const result = await signIn("credentials", {
          email,
          password: pwd,
          redirect: false,
        })
        if (result?.ok) {
          const redirect = callbackUrl || `/${lang}`
          window.location.href = redirect
        } else {
          // Fallback: redirect to login
          router.push(
            callbackUrl
              ? `/${lang}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
              : `/${lang}/login`
          )
        }
      } catch {
        router.push(`/${lang}/login`)
      }
    },
    [callbackUrl, lang, router]
  )

  // Polling for verification status (when user clicks link in another tab/device)
  useEffect(() => {
    if (mode !== "verify" || !verifyEmail) return

    pollingRef.current = setInterval(async () => {
      const { verified } = await checkVerificationStatus(verifyEmail)
      if (verified) {
        if (pollingRef.current) clearInterval(pollingRef.current)
        setSuccess(dictionary?.auth?.emailVerified || "Email verified!")
        await autoLogin(verifyEmail, password)
      }
    }, 3000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [mode, verifyEmail, password, autoLogin, dictionary])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("")
    setSuccess("")

    startTransition(() => {
      register(values, lang, callbackUrl).then((data) => {
        if (data.error) {
          setError(data.error)
        }
        if (data.success && data.email) {
          setVerifyEmail(data.email)
          setPassword(values.password)
          setMode("verify")
          setResendCooldown(60)
        }
      })
    })
  }

  const handleOTPComplete = (code: string) => {
    if (code.length !== 4) return
    setError("")
    setSuccess("")

    startTransition(async () => {
      const result = await verifyOTP(verifyEmail, code)
      if (result.error) {
        setError(result.error)
        setOtpValue("")
      }
      if (result.success) {
        setSuccess(dictionary?.auth?.emailVerified || "Email verified!")
        await autoLogin(verifyEmail, password)
      }
    })
  }

  const handleResend = () => {
    if (resendCooldown > 0) return
    setError("")
    setSuccess("")

    startTransition(async () => {
      const result = await resendVerificationCode(
        verifyEmail,
        lang,
        callbackUrl ?? undefined
      )
      if (result.error) setError(result.error)
      if (result.success) {
        setSuccess(result.success)
        setResendCooldown(60)
        setOtpValue("")
      }
    })
  }

  // ── Verify mode ──
  if (mode === "verify") {
    return (
      <div
        className={cn(
          "flex min-w-[280px] flex-col gap-6 md:min-w-[350px]",
          className
        )}
        {...rest}
      >
        <Card className="bg-background border-none shadow-none">
          <CardHeader className="text-center">
            <h4 className="mb-2">
              {dictionary?.auth?.checkYourEmail || "Check your email"}
            </h4>
            <p className="text-muted-foreground">
              {dictionary?.auth?.codeSentTo || "We sent a code to"}{" "}
              <strong>{maskEmail(verifyEmail)}</strong>
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={4}
                  value={otpValue}
                  onChange={(val) => {
                    setOtpValue(val)
                    if (val.length === 4) handleOTPComplete(val)
                  }}
                  disabled={isPending}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <FormError message={error} />
              <FormSuccess message={success} />

              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending || resendCooldown > 0}
                  onClick={handleResend}
                  type="button"
                >
                  {resendCooldown > 0
                    ? `${dictionary?.auth?.resendIn || "Resend in"} ${resendCooldown}s`
                    : dictionary?.auth?.resendCode || "Resend code"}
                </Button>

                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
                  onClick={() => {
                    setMode("register")
                    setError("")
                    setSuccess("")
                    setOtpValue("")
                    if (pollingRef.current) clearInterval(pollingRef.current)
                  }}
                >
                  {dictionary?.auth?.wrongEmail || "Wrong email?"}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Register mode ──
  return (
    <div
      className={cn(
        "flex min-w-[280px] flex-col gap-6 md:min-w-[350px]",
        className
      )}
      {...rest}
    >
      <Card className="bg-background border-none shadow-none">
        <CardHeader className="text-center" />
        <CardContent>
          <Suspense fallback={<div className="h-10" />}>
            <Social dictionary={dictionary} />
          </Suspense>
        </CardContent>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
              <div className="muted after:border-border relative text-center after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-background text-muted-foreground relative z-10 px-2">
                  {dictionary?.auth?.orContinueWith || "Or continue with"}
                </span>
              </div>

              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder={dictionary?.auth?.username || "Name"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder={dictionary?.auth?.email || "Email"}
                          type="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder={dictionary?.auth?.password || "Password"}
                          type="password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormError message={error} />
                <FormSuccess message={success} />

                <Button
                  disabled={isPending}
                  type="submit"
                  className="h-11 w-full"
                >
                  {dictionary?.auth?.signUp || "Join"}
                </Button>
              </div>

              <div className="muted text-center">
                <Link
                  href={
                    callbackUrl
                      ? `/${lang}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
                      : `/${lang}/login`
                  }
                  className="underline-offset-4 hover:underline"
                >
                  {dictionary?.auth?.alreadyHaveAccount ||
                    "Already have an account?"}
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
