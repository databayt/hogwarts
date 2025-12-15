"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
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
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

import { FormError } from "../error/form-error"
import { FormSuccess } from "../form-success"
import { createResetSchema } from "../validation"
import { reset } from "./action"

interface Props extends React.ComponentPropsWithoutRef<"div"> {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export const ResetForm = (props: Props) => {
  const { dictionary, lang, className, ...rest } = props
  const [error, setError] = useState<string | undefined>("")
  const [success, setSuccess] = useState<string | undefined>("")
  const [isPending, startTransition] = useTransition()

  // Create localized schema (memoized)
  const ResetSchema = useMemo(() => createResetSchema(dictionary), [dictionary])

  const form = useForm<z.infer<typeof ResetSchema>>({
    resolver: zodResolver(ResetSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = (values: z.infer<typeof ResetSchema>) => {
    setError("")
    setSuccess("")

    startTransition(() => {
      reset(values).then((data) => {
        setError(data?.error)
        setSuccess(data?.success)
      })
    })
  }

  return (
    <div
      className={cn(
        "flex min-w-[200px] flex-col gap-6 md:min-w-[350px]",
        className
      )}
      {...rest}
    >
      <Card className="bg-background border-none shadow-none">
        <CardHeader className="text-center" />
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
              <div className="grid gap-6">
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

                <FormError message={error} />
                <FormSuccess message={success} />

                <Button
                  disabled={isPending}
                  type="submit"
                  className="h-11 w-full"
                >
                  {dictionary?.auth?.resetPassword || "Reset password"}
                </Button>
              </div>

              <div className="muted text-center">
                <Link
                  href="/login"
                  className="underline-offset-4 hover:underline"
                >
                  {dictionary?.common?.back || "Back to login"}
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
