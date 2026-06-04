// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"
import Link from "next/link"
import { ShieldX } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  params: Promise<{ lang: Locale }>
}

const AccessDeniedPage = async ({ params }: Props) => {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const t = dictionary.accessDenied
  const reasons = [t.reason1, t.reason2, t.reason3]

  return (
    <Suspense fallback={<div className="h-10" />}>
      <Card className="border-destructive/20 w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
            <ShieldX className="text-destructive size-8" />
          </div>
          <CardTitle className="text-destructive">{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            {reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 pt-4">
            <Button asChild>
              <Link href={`/${lang}`}>{t.backHome}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Suspense>
  )
}

export default AccessDeniedPage
