"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { AnthropicIcons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { School } from "../../types"
import { resumeApplicationSession } from "../actions"

interface Props {
  school: School
  dictionary: Dictionary
  lang: Locale
  subdomain: string
  initialToken?: string
}

const continueSchema = z.object({
  email: z.string().email("Invalid email address"),
  sessionToken: z.string().optional(),
})

type ContinueFormData = z.infer<typeof continueSchema>

export default function ContinueApplicationContent({
  school,
  dictionary,
  lang,
  subdomain,
  initialToken,
}: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const isRTL = lang === "ar"

  const dict =
    (
      dictionary as unknown as {
        school?: { admission?: { continueApp?: Record<string, string> } }
      }
    )?.school?.admission?.continueApp ?? {}

  const form = useForm<ContinueFormData>({
    resolver: zodResolver(continueSchema),
    defaultValues: {
      email: "",
      sessionToken: initialToken || "",
    },
  })

  const onSubmit = async (data: ContinueFormData) => {
    setIsLoading(true)
    try {
      const result = await resumeApplicationSession(data.sessionToken || "")

      if (result.success && result.data) {
        // Redirect to the application form with the session token
        const campaignId =
          (result.data.formData as { campaignId?: string })?.campaignId ||
          result.data.campaignId
        if (campaignId) {
          router.push(`/${lang}/apply/${campaignId}?token=${data.sessionToken}`)
        } else {
          toast.error(dict.campaignNotFound || "Campaign not found")
        }
      } else {
        toast.error(
          result.error || dict.noSavedFound || "No saved application found"
        )
      }
    } catch (error) {
      toast.error(dict.failedToResume || "Failed to resume application")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="bg-primary/10 mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full">
          <AnthropicIcons.Archive className="text-primary h-8 w-8" />
        </div>
        <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">
          {dict.title || "Continue Your Application"}
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-md leading-relaxed">
          {dict.subtitle || "Enter your email to resume your saved application"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{school.name}</CardTitle>
          <CardDescription>
            {dict.emailMustMatch ||
              "Email must match the one used in your original application"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {dict.emailAddress || "Email Address"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="example@email.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!initialToken && (
                <FormField
                  control={form.control}
                  name="sessionToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {dict.sessionToken || "Session Token (Optional)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={
                            dict.sessionTokenPlaceholder ||
                            "Enter session token if you have one"
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button
                type="submit"
                className="group w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {dict.searching || "Searching..."}
                  </>
                ) : (
                  <>
                    {dict.resumeApplication || "Resume Application"}
                    <AnthropicIcons.ArrowRight className="ms-2 h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-4 text-center">
        <p className="text-muted-foreground text-sm">
          {dict.noSavedApp || "Don't have a saved application?"}
        </p>
        <Link href={`/${lang}/apply`}>
          <Button variant="outline">
            {dict.startNew || "Start New Application"}
          </Button>
        </Link>
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AnthropicIcons.Checklist className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 className="mb-2 font-medium">
                {dict.importantInfo || "Important Information"}
              </h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {dict.autoSaveNote ||
                    "Applications are auto-saved every 30 seconds"}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {dict.sessionExpiry || "Saved sessions expire after 7 days"}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {dict.resumeFromEmail ||
                    "You can also resume from the link sent to your email"}
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
