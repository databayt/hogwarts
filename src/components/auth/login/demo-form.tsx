"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useParams, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { FormError } from "../error/form-error"
import { demoRoleLogin } from "./demo-action"
import { LoginForm } from "./form"

export interface DemoRoleOption {
  key: string
  label: string
}

interface DemoLoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  dictionary?: Dictionary
  roles: DemoRoleOption[]
}

/**
 * Login for the demo tenant: pick a role, press Login. It runs the same server
 * action the typed form runs, so the resulting session is indistinguishable from
 * someone entering that role's credentials by hand.
 */
export const DemoLoginForm = ({
  className,
  dictionary,
  roles,
  ...props
}: DemoLoginFormProps) => {
  const params = useParams()
  const lang = params.lang as string
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl")

  const [mode, setMode] = useState<"role" | "manual">("role")
  // Admin is the role most visitors want to see, so it's preselected — Login
  // works on first click. Named explicitly rather than taken from roles[0] so
  // reordering DEMO_ROLE_KEYS can't silently change the default.
  const [role, setRole] = useState(
    roles.some((r) => r.key === "admin") ? "admin" : (roles[0]?.key ?? "")
  )
  const [error, setError] = useState<string | undefined>("")
  const [isPending, startTransition] = useTransition()

  if (mode === "manual") {
    return (
      <LoginForm className={className} dictionary={dictionary} {...props} />
    )
  }

  const genericError =
    dictionary?.messages?.toast?.error?.generic || "Something went wrong"
  const errorCodeMap: Record<string, string> = {
    EMAIL_NOT_FOUND:
      dictionary?.messages?.errors?.auth?.accountNotFound ??
      "Account not found",
    INVALID_CREDENTIALS:
      dictionary?.messages?.errors?.auth?.invalidCredentials ??
      "Invalid email or password",
  }

  const onSubmit = () => {
    if (!role) return
    setError("")

    startTransition(() => {
      demoRoleLogin(role, { locale: lang, callbackUrl })
        .then((data) => {
          if (data?.error) {
            setError(errorCodeMap[data.error] ?? data.error)
            return
          }
          if (data?.redirectUrl) {
            // Hard redirect to force a full reload -> fresh session, matching
            // the typed-credentials path in form.tsx.
            window.location.href = data.redirectUrl
            return
          }
          // twoFactor / needsVerification shouldn't happen for seeded demo
          // accounts, but must not fail silently if the seed drifts.
          setError(genericError)
        })
        .catch(() => setError(genericError))
    })
  }

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
          <p id="demo-role-prompt" className="text-muted-foreground">
            {dictionary?.auth?.demoRolePrompt ||
              "Choose a role to explore the demo"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-4">
              <Select value={role} onValueChange={setRole} disabled={isPending}>
                <SelectTrigger
                  id="demo-role"
                  aria-labelledby="demo-role-prompt"
                  className="hover:border-foreground/50 h-12 w-full rounded-lg px-4 transition-colors"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg p-1.5">
                  {roles.map((option) => (
                    <SelectItem
                      key={option.key}
                      value={option.key}
                      className="data-[state=checked]:bg-accent h-10 rounded-md ps-3"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <FormError message={error} />

              <Button
                type="button"
                disabled={isPending || !role}
                onClick={onSubmit}
                className="h-11 w-full"
              >
                {dictionary?.auth?.signIn || "Login"}
              </Button>
            </div>

            <div className="muted text-center">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setMode("manual")
                  setError("")
                }}
              >
                {dictionary?.auth?.useEmailInstead ||
                  "Sign in with email instead"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
