"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
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
import { NewPasswordSchema } from "../validation"
import { newPassword } from "./action"

interface Props extends React.ComponentPropsWithoutRef<"div"> {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export const NewPasswordForm = (props: Props) => {
  const { dictionary, lang, className, ...rest } = props
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [error, setError] = useState<string | undefined>("")
  const [success, setSuccess] = useState<string | undefined>("")
  const [isPending, startTransition] = useTransition()

  const form = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: {
      password: "",
    },
  })

  const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
    setError("")
    setSuccess("")

    startTransition(() => {
      newPassword(values, token).then((data) => {
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
        <CardHeader className="text-center">
          <h4>Enter a new password</h4>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder="New Password"
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
                  Reset password
                </Button>
              </div>

              <div className="muted text-center">
                <Link
                  href="/login"
                  className="underline-offset-4 hover:underline"
                >
                  Back to login
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
