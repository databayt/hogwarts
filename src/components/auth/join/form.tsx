"use client"

import { Suspense, useMemo, useState, useTransition } from "react"
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
import { Social } from "../social"
import { createRegisterSchema } from "../validation"
import { register } from "./action"

interface Props extends React.ComponentPropsWithoutRef<"div"> {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export const RegisterForm = (props: Props) => {
  const { dictionary, lang, className, ...rest } = props
  const [error, setError] = useState<string | undefined>("")
  const [success, setSuccess] = useState<string | undefined>("")
  const [isPending, startTransition] = useTransition()

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

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("")
    setSuccess("")

    startTransition(() => {
      register(values).then((data) => {
        setError(data.error)
        setSuccess(data.success)
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
                  href="/login"
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
