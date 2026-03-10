"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

interface Props extends React.ComponentPropsWithoutRef<"div"> {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export const ErrorCard = (props: Props) => {
  const { dictionary, lang, className, ...rest } = props
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification:
      "The verification link may have expired or already been used.",
    OAuthSignin: "Could not initiate sign in with OAuth provider.",
    OAuthCallback: "Error completing OAuth sign in.",
    OAuthCreateAccount: "Could not create OAuth user in database.",
    EmailCreateAccount: "Could not create email user in database.",
    Callback: "Something went wrong with the authentication callback.",
    OAuthAccountNotLinked:
      "This email is already associated with another account.",
    EmailSignin: "The email could not be sent.",
    CredentialsSignin: "The credentials you provided are invalid.",
    SessionRequired: "You must be signed in to access this page.",
    default: "An unexpected error occurred.",
  }

  const errorMessage =
    error && errorMessages[error] ? errorMessages[error] : errorMessages.default

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
          <h4>
            {dictionary?.auth?.authenticationError || "Authentication Error"}
          </h4>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex w-full flex-col items-center gap-4">
              <div className="bg-destructive/15 text-destructive flex items-center gap-x-2 rounded-md p-3 text-sm">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <p>{errorMessage}</p>
              </div>
              {error && (
                <div className="text-muted-foreground text-center text-xs">
                  <p>Error code: {error}</p>
                </div>
              )}
            </div>

            <div className="muted text-center">
              <Link
                href={`/${lang}/login`}
                className="underline-offset-4 hover:underline"
              >
                {dictionary?.auth?.backToLogin || "Back to login"}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
