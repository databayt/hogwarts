"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { changePassword } from "./actions"
import { type ChangePasswordInput } from "./validation"

export type ChangePasswordLabels = Partial<
  Record<
    | "current"
    | "currentPlaceholder"
    | "new"
    | "newPlaceholder"
    | "confirm"
    | "submit"
    | "submitting"
    | "success"
    | "wrongCurrent"
    | "mismatch"
    | "tooShort"
    | "failed"
    | "forgotHint",
    string
  >
>

interface ChangePasswordFormProps {
  /** Whether the user has an existing password (false for OAuth-only users) */
  hasPassword: boolean
  /** Called after a successful password change */
  onSuccess?: () => void
  /** `dictionary.auth.changePassword` */
  labels?: ChangePasswordLabels
}

export function ChangePasswordForm({
  hasPassword,
  onSuccess,
  labels,
}: ChangePasswordFormProps) {
  const t = (key: keyof ChangePasswordLabels, fallback: string) =>
    labels?.[key] || fallback
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | undefined>()
  const [success, setSuccess] = useState<string | undefined>()

  const form = useForm<ChangePasswordInput>({
    // Same rules as the server schema, with this locale's messages.
    resolver: zodResolver(
      z
        .object({
          currentPassword: z.string().optional(),
          newPassword: z
            .string()
            .min(4, t("tooShort", "At least 4 characters")),
          confirmPassword: z
            .string()
            .min(1, t("mismatch", "The two passwords don't match")),
        })
        .refine((d) => d.newPassword === d.confirmPassword, {
          message: t("mismatch", "The two passwords don't match"),
          path: ["confirmPassword"],
        })
    ),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const onSubmit = (values: ChangePasswordInput) => {
    setError(undefined)
    setSuccess(undefined)

    startTransition(async () => {
      const result = await changePassword(values)
      if (result.success) {
        setSuccess(t("success", "Password changed"))
        form.reset()
        onSuccess?.()
      } else {
        setError(
          result.code === "WRONG_CURRENT"
            ? t("wrongCurrent", "The current password is wrong")
            : t("failed", "Couldn't change the password. Try again.")
        )
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        {hasPassword && (
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("current", "Current password")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    dir="ltr"
                    disabled={isPending}
                    placeholder={t(
                      "currentPlaceholder",
                      "Your current password"
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("new", "New password")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  dir="ltr"
                  disabled={isPending}
                  placeholder={t("newPlaceholder", "4 digits or more")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("confirm", "Type it again")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  dir="ltr"
                  disabled={isPending}
                  placeholder={t("newPlaceholder", "4 digits or more")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && <p className="text-destructive text-sm">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending
            ? t("submitting", "Changing...")
            : t("submit", "Change password")}
        </Button>

        {hasPassword && (
          <p className="text-muted-foreground text-xs">
            {t(
              "forgotHint",
              "Forgot your current password? Ask the school office — they can reset it for you any time."
            )}
          </p>
        )}
      </form>
    </Form>
  )
}
