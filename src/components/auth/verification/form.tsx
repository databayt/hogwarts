"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { BeatLoader } from "react-spinners"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

import { FormError } from "../error/form-error"
import { FormSuccess } from "../form-success"
import { newVerification } from "./action"

interface Props extends React.ComponentPropsWithoutRef<"div"> {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export const NewVerificationForm = (props: Props) => {
  const { dictionary, lang, className, ...rest } = props
  const [error, setError] = useState<string | undefined>()
  const [success, setSuccess] = useState<string | undefined>()

  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const onSubmit = useCallback(() => {
    if (success || error) return

    if (!token) {
      setError("Missing token!")
      return
    }

    newVerification(token)
      .then((data) => {
        setSuccess(data.success)
        setError(data.error)
      })
      .catch(() => {
        setError("Something went wrong!")
      })
  }, [token, success, error])

  useEffect(() => {
    if (token) {
      onSubmit()
    }
  }, [token, onSubmit])

  return (
    <div
      className={cn(
        "flex min-w-[200px] flex-col gap-6 md:min-w-[350px]",
        className
      )}
      {...rest}
    >
      <Card className="bg-background border-none shadow-none">
        <CardHeader className="text-center">
          <h4>Confirming your verification</h4>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex w-full items-center justify-center">
              {!success && !error && <BeatLoader />}
              <FormSuccess message={success} />
              {!success && <FormError message={error} />}
            </div>

            <div className="muted text-center">
              <Link
                href="/login"
                className="underline-offset-4 hover:underline"
              >
                Back to login
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
