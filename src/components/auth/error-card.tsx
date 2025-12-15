"use client"

import { useSearchParams } from "next/navigation"
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"

import { CardWrapper } from "@/components/auth/card-wrapper"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export const ErrorCard = (props: Props) => {
  const { dictionary, lang } = props
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
    <CardWrapper
      headerLabel="Authentication Error"
      backButtonHref="/login"
      backButtonLabel="Back to login"
    >
      <div className="flex w-full flex-col items-center gap-4">
        <div className="bg-destructive/15 text-destructive flex items-center gap-x-2 rounded-md p-3 text-sm">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <p>{errorMessage}</p>
        </div>
        {error && (
          <div className="text-muted-foreground text-center text-xs">
            <p>Error code: {error}</p>
            {/* DEBUG: Show all URL params to capture full error */}
            <pre className="bg-muted mt-2 max-w-full overflow-auto rounded p-2 text-left text-[10px]">
              {JSON.stringify(
                Object.fromEntries(searchParams.entries()),
                null,
                2
              )}
            </pre>
            <p className="mt-2">
              If this problem persists, please contact support.
            </p>
          </div>
        )}
      </div>
    </CardWrapper>
  )
}
