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
import { useParams, useRouter, useSearchParams } from "next/navigation"
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
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { FormError } from "../error/form-error"
import { Social } from "../social"
import { createLoginSchema } from "../validation"
import {
  checkVerificationStatus,
  resendVerificationCode,
  verifyOTP,
} from "../verification/action"
import { login, type LoginContext, type LoginOptions } from "./action"

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  dictionary?: Dictionary
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!domain) return email
  const visible = local.slice(0, Math.min(2, local.length))
  return `${visible}${"*".repeat(Math.max(local.length - 2, 0))}@${domain}`
}

export const LoginForm = ({
  className,
  dictionary,
  ...props
}: LoginFormProps) => {
  const params = useParams()
  const lang = params.lang as string
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl")
  const tenant = searchParams.get("tenant")
  // New context params for user flow distinction
  const context = (searchParams.get("context") as LoginContext) || "saas"
  const subdomainParam = searchParams.get("subdomain")

  // Detect subdomain from hostname as fallback (handles direct navigation to login)
  const subdomain = useMemo(() => {
    if (subdomainParam) return subdomainParam
    if (typeof window === "undefined") return null
    const host = window.location.hostname
    if (host.endsWith(".databayt.org") && !host.startsWith("ed.")) {
      return host.split(".")[0]
    }
    if (host.includes(".localhost") && host !== "localhost") {
      const sub = host.split(".")[0]
      if (sub !== "www" && sub !== "localhost") return sub
    }
    return null
  }, [subdomainParam])

  // Override context to "school" when subdomain is detected
  const effectiveContext = subdomain ? "school" : context

  // Get localized error messages
  const oauthError =
    dictionary?.messages?.errors?.auth?.emailAlreadyExists ||
    "Email already in use with different provider!"
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked" ? oauthError : ""

  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [mode, setMode] = useState<"login" | "verify">("login")
  const [verifyEmail, setVerifyEmail] = useState("")
  const [verifyPassword, setVerifyPassword] = useState("")
  const [error, setError] = useState<string | undefined>("")
  const [success, setSuccess] = useState<string | undefined>("")
  const [isPending, startTransition] = useTransition()
  const [otpValue, setOtpValue] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Handle tenant redirect after successful login
  useEffect(() => {
    const tenant = searchParams.get("tenant")

    if (tenant && success) {
      const useHttps =
        typeof window !== "undefined" && window.location.protocol === "https:"
      const protocol = useHttps ? "https" : "http"
      const tenantUrl =
        process.env.NODE_ENV === "production"
          ? `https://${tenant}.databayt.org/dashboard`
          : `${protocol}://${tenant}.localhost:3000/dashboard`

      window.location.href = tenantUrl
    }
  }, [success, searchParams])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

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
          // Re-run login action to get proper redirect URL
          const loginOptions: LoginOptions = {
            callbackUrl,
            context: effectiveContext,
            subdomain,
            locale: lang,
          }
          const loginResult = await login(
            { email, password: pwd },
            loginOptions
          )
          if (loginResult?.redirectUrl && !tenant) {
            window.location.href = loginResult.redirectUrl
          } else if (!tenant) {
            window.location.href = callbackUrl || `/${lang}`
          }
        } else {
          router.push(`/${lang}/login`)
        }
      } catch {
        router.push(`/${lang}/login`)
      }
    },
    [callbackUrl, effectiveContext, subdomain, lang, tenant, router]
  )

  // Polling for verification status
  useEffect(() => {
    if (mode !== "verify" || !verifyEmail) return

    pollingRef.current = setInterval(async () => {
      const { verified } = await checkVerificationStatus(verifyEmail)
      if (verified) {
        if (pollingRef.current) clearInterval(pollingRef.current)
        await autoLogin(verifyEmail, verifyPassword)
      }
    }, 3000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [mode, verifyEmail, verifyPassword, autoLogin, dictionary])

  // Create localized schema (memoized to prevent recreation on every render)
  const LoginSchema = useMemo(() => {
    if (!dictionary) {
      // Fallback to legacy schema if dictionary not available
      return createLoginSchema({
        messages: {
          validation: {
            email: "Email is required",
            passwordRequired: "Password is required",
          },
          toast: { success: {}, error: {}, warning: {}, info: {} },
          errors: {
            server: {},
            auth: {},
            tenant: {},
            resource: {},
            file: {},
            payment: {},
            integration: {},
          },
        },
      } as any)
    }
    return createLoginSchema(dictionary)
  }, [dictionary])

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

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
        await autoLogin(verifyEmail, verifyPassword)
      }
    })
  }

  const handleResend = () => {
    if (resendCooldown > 0) return
    setError("")
    setSuccess("")

    startTransition(async () => {
      const result = await resendVerificationCode(verifyEmail, lang)
      if (result.error) setError(result.error)
      if (result.success) {
        setSuccess(result.success)
        setResendCooldown(90)
        setOtpValue("")
      }
    })
  }

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("")
    setSuccess("")

    // Construct callback URL with tenant if present
    let finalCallbackUrl = callbackUrl
    if (tenant && !finalCallbackUrl?.includes("tenant=")) {
      const separator = finalCallbackUrl?.includes("?") ? "&" : "?"
      finalCallbackUrl = `${finalCallbackUrl || "/dashboard"}${separator}tenant=${tenant}`
    }

    // Build login options with context for user flow distinction
    const loginOptions: LoginOptions = {
      callbackUrl: finalCallbackUrl,
      context: effectiveContext,
      subdomain,
      locale: lang,
    }

    startTransition(() => {
      login(values, loginOptions)
        .then((data) => {
          if (data?.error) {
            form.reset()
            setError(data.error)
          }
          if (data?.success) {
            form.reset()
            setSuccess(data.success)
            // Hard redirect to force full page reload → fresh session
            // Skip if tenant param present (handled by useEffect above)
            if (data.redirectUrl && !tenant) {
              window.location.href = data.redirectUrl
            }
          }
          if (data?.twoFactor) {
            setShowTwoFactor(true)
          }
          if (data?.needsVerification && data?.email) {
            setVerifyEmail(data.email)
            setVerifyPassword(values.password)
            setMode("verify")
            setResendCooldown(90)
          }
        })
        .catch(() => {
          setError(
            dictionary?.messages?.toast?.error?.generic ||
              "Something went wrong"
          )
        })
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
        {...props}
      >
        <Card className="bg-background border-none shadow-none">
          <CardHeader className="text-center">
            <h4 className="mb-2">
              {dictionary?.auth?.verifyYourEmail || "Verify your email"}
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
                    <InputOTPSlot
                      index={0}
                      className="h-14 w-14 rounded-md border text-2xl"
                    />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot
                      index={1}
                      className="h-14 w-14 rounded-md border text-2xl"
                    />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot
                      index={2}
                      className="h-14 w-14 rounded-md border text-2xl"
                    />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot
                      index={3}
                      className="h-14 w-14 rounded-md border text-2xl"
                    />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <FormError message={error} />

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
                    setMode("login")
                    setError("")
                    setSuccess("")
                    setOtpValue("")
                    if (pollingRef.current) clearInterval(pollingRef.current)
                  }}
                >
                  {dictionary?.auth?.backToLogin || "Back to login"}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Login mode ──
  return (
    <div
      className={cn(
        "flex min-w-[280px] flex-col gap-6 md:min-w-[350px]",
        className
      )}
      {...props}
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
                {showTwoFactor ? (
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder={
                              dictionary?.auth?.twoFactorCode ||
                              "Two Factor Code"
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="grid gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              id="email"
                              type="email"
                              disabled={isPending}
                              placeholder={dictionary?.auth?.email || "Email"}
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
                              id="password"
                              type="password"
                              disabled={isPending}
                              placeholder={
                                dictionary?.auth?.password || "Password"
                              }
                            />
                          </FormControl>
                          <Link
                            href="/reset"
                            className="muted text-start underline-offset-4 hover:underline"
                          >
                            {dictionary?.auth?.forgotPassword ||
                              "Forgot password?"}
                          </Link>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormError message={error || urlError} />

                <Button
                  disabled={isPending}
                  type="submit"
                  className="h-11 w-full"
                >
                  {showTwoFactor
                    ? dictionary?.auth?.confirm || "Confirm"
                    : dictionary?.auth?.signIn || "Login"}
                </Button>
              </div>

              <div className="muted text-center">
                <Link
                  href={
                    callbackUrl
                      ? `/join?callbackUrl=${encodeURIComponent(callbackUrl)}`
                      : "/join"
                  }
                  className="underline-offset-4 hover:underline"
                >
                  {dictionary?.auth?.dontHaveAccount ||
                    "Don't have an account?"}
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
