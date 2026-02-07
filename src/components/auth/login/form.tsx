"use client"

import { Suspense, useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  // CardDescription,
  CardHeader,
  // CardTitle,
} from "@/components/ui/card"
// import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { FormError } from "../error/form-error"
import { FormSuccess } from "../form-success"
import { Social } from "../social"
import { createLoginSchema } from "../validation"
import { login, type LoginContext, type LoginOptions } from "./action"

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  dictionary?: Dictionary
}

export const LoginForm = ({
  className,
  dictionary,
  ...props
}: LoginFormProps) => {
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
  const [error, setError] = useState<string | undefined>("")
  const [success, setSuccess] = useState<string | undefined>("")
  const [isPending, startTransition] = useTransition()

  // Handle tenant redirect after successful login
  useEffect(() => {
    const tenant = searchParams.get("tenant")

    if (tenant && success) {
      // Redirect back to tenant subdomain after successful login
      // Use HTTPS if current page is HTTPS (for dev mode with self-signed certs)
      const useHttps =
        typeof window !== "undefined" && window.location.protocol === "https:"
      const protocol = useHttps ? "https" : "http"
      const tenantUrl =
        process.env.NODE_ENV === "production"
          ? `https://${tenant}.databayt.org/dashboard`
          : `${protocol}://${tenant}.localhost:3000/dashboard`

      console.log("🔄 Redirecting to tenant after login:", tenantUrl)
      window.location.href = tenantUrl
    }
  }, [success, searchParams])

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
    }

    console.log("📋 LOGIN FORM SUBMIT:", {
      tenant,
      callbackUrl,
      finalCallbackUrl,
      context,
      subdomain,
      hasValues: !!values,
    })

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
          }
          if (data?.twoFactor) {
            setShowTwoFactor(true)
          }
        })
        .catch((error) => {
          // Don't show error for redirect - this is expected behavior for successful login
          // NextAuth throws NEXT_REDIRECT when signIn succeeds with a redirect
          if (error?.digest?.startsWith?.("NEXT_REDIRECT")) {
            return // Redirect is happening, no need to show error
          }
          setError(
            dictionary?.messages?.toast?.error?.generic ||
              "Something went wrong"
          )
        })
    })
  }

  return (
    <div
      className={cn(
        "flex min-w-[200px] flex-col gap-6 md:min-w-[350px]",
        className
      )}
      {...props}
    >
      <Card className="bg-background border-none shadow-none">
        <CardHeader className="text-center">
          {/* <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Apple or Google account
          </CardDescription> */}
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-10" />}>
            <Social />
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
                <FormSuccess message={success} />

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
                  href="/join"
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
      {/* <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        By clicking continue, you agree to our <br/> <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div> */}
    </div>
  )
}
