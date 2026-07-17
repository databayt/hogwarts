"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm, useFormContext } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { createI18nHelpers } from "@/components/internationalization/helpers"

import { updatePaymentSettings, type PaymentSettingsData } from "./actions"
import {
  createPaymentSettingsSchema,
  type PaymentSettingsFormData,
} from "./validation"

interface Props {
  initial: PaymentSettingsData
  dictionary: Dictionary
}

/**
 * Bankak / Cashi rail configuration.
 *
 * Both are manual rails — Sudan has no merchant API for either (see
 * providers/bankak.ts), so what's captured here is exactly what a parent needs
 * in order to transfer from their own app: an account to send to, optionally a
 * QR to scan, and any school-specific instructions.
 */
export function PaymentSettingsForm({ initial, dictionary }: Props) {
  const [isPending, startTransition] = useTransition()
  const { validation: v, toast: t } = useMemo(
    () => createI18nHelpers(dictionary.messages),
    [dictionary]
  )
  const d = (dictionary as any)?.finance?.paymentSettings as
    | Record<string, string>
    | undefined

  const form = useForm<PaymentSettingsFormData>({
    resolver: zodResolver(createPaymentSettingsSchema(v)),
    defaultValues: {
      ...initial,
      bankakAccountName: initial.bankakAccountName ?? "",
      bankakAccountNumber: initial.bankakAccountNumber ?? "",
      bankakQrUrl: initial.bankakQrUrl ?? "",
      bankakInstructions: initial.bankakInstructions ?? "",
      cashiAccountName: initial.cashiAccountName ?? "",
      cashiMerchantCode: initial.cashiMerchantCode ?? "",
      cashiQrUrl: initial.cashiQrUrl ?? "",
      cashiInstructions: initial.cashiInstructions ?? "",
    },
  })

  const bankakEnabled = form.watch("bankakEnabled")
  const cashiEnabled = form.watch("cashiEnabled")

  function onSubmit(values: PaymentSettingsFormData) {
    startTransition(async () => {
      const result = await updatePaymentSettings(values)
      if (result.success) toast.success(t.success.saved())
      else toast.error(t.error.saveFailed())
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Bankak */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{d?.bankakTitle || "Bankak (بنكك)"}</CardTitle>
                <CardDescription>
                  {d?.bankakDescription ||
                    "Bank of Khartoum. Parents transfer in the Bankak app and attach the receipt for your team to verify."}
                </CardDescription>
              </div>
              <FormField
                control={form.control}
                name="bankakEnabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label={d?.bankakTitle || "Bankak"}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardHeader>
          {bankakEnabled && (
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="bankakAccountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{d?.accountName || "Account name"}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankakAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {d?.accountNumber || "Account number"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          dir="ltr"
                          className="font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="bankakQrUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {d?.qrUrl || "Bankak Pay QR image URL"}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} dir="ltr" />
                    </FormControl>
                    <FormDescription>
                      {d?.qrHint ||
                        "Optional. Parents can scan this instead of typing the account number."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankakInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{d?.instructions || "Instructions"}</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          )}
        </Card>

        {/* Cashi */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{d?.cashiTitle || "Cashi (كاشي)"}</CardTitle>
                <CardDescription>
                  {d?.cashiDescription ||
                    "MyCashi wallet. Parents send to your merchant code and attach the receipt for your team to verify."}
                </CardDescription>
              </div>
              <FormField
                control={form.control}
                name="cashiEnabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label={d?.cashiTitle || "Cashi"}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardHeader>
          {cashiEnabled && (
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="cashiAccountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{d?.accountName || "Account name"}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cashiMerchantCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {d?.merchantCode || "Merchant code"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          dir="ltr"
                          className="font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="cashiQrUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {d?.cashiQrUrl || "Cashi QR image URL"}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cashiInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{d?.instructions || "Instructions"}</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          )}
        </Card>

        {/* Reminder ladder */}
        <Card>
          <CardHeader>
            <CardTitle>{d?.remindersTitle || "Payment reminders"}</CardTitle>
            <CardDescription>
              {d?.remindersDescription ||
                "When to chase an unpaid fee. Reminders go out in-app, by email, and over WhatsApp."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <DaysField
                name="reminderLadderDays"
                defaultValue={initial.reminderLadderDays}
                label={d?.beforeDue || "Days before due date"}
                hint={d?.beforeDueHint || "Comma-separated, e.g. 7, 3, 1"}
              />
              <DaysField
                name="overdueLadderDays"
                defaultValue={initial.overdueLadderDays}
                label={d?.afterDue || "Days after due date"}
                hint={d?.afterDueHint || "Comma-separated, e.g. 1, 7, 14, 30"}
              />
            </div>
            <FormField
              control={form.control}
              name="bursarEscalationDays"
              render={({ field }) => (
                <FormItem className="sm:max-w-xs">
                  <FormLabel>
                    {d?.escalation ||
                      "Escalate to finance after (days overdue)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    {d?.escalationHint ||
                      "Notifies ADMIN and ACCOUNTANT when a fee stays unpaid this long."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
          {dictionary.common?.save || "Save"}
        </Button>
      </form>
    </Form>
  )
}

/**
 * Day-ladder input. Stored as Int[], edited as a comma-separated string so a
 * bursar can type "7, 3, 1" rather than manage a chip editor.
 */
function DaysField({
  name,
  label,
  hint,
  defaultValue,
}: {
  name: "reminderLadderDays" | "overdueLadderDays"
  label: string
  hint: string
  defaultValue: number[]
}) {
  const { control, setValue } = useFormContext<PaymentSettingsFormData>()
  // Raw text is held here, in the component body — NOT inside FormField's
  // render prop, which react-hook-form calls as a plain function (a hook in
  // there would break the rules of hooks). Keeping it local also means typing
  // "7, " isn't eaten mid-edit by a re-render of the parsed array.
  const [text, setText] = useState(defaultValue.join(", "))

  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              dir="ltr"
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setValue(
                  name,
                  e.target.value
                    .split(",")
                    .map((s) => Number(s.trim()))
                    .filter((n) => Number.isInteger(n) && n >= 0),
                  { shouldValidate: true, shouldDirty: true }
                )
              }}
            />
          </FormControl>
          <FormDescription>{hint}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
