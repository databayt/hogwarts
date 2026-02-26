"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { useDictionary } from "@/components/internationalization/use-dictionary"

import { Button } from "../ui/button"

interface NewComersProps {
  lang?: string
  subdomain?: string
}

export function NewComers({ lang = "en", subdomain }: NewComersProps) {
  const { dictionary } = useDictionary()
  const t = dictionary?.marketing?.site?.newComers

  const joinHref = subdomain ? `/${lang}/s/${subdomain}/join` : "/onboarding"

  return (
    <section className="py-16 md:py-24">
      <div className="text-center">
        <p className="text-muted-foreground flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {t?.internal || "Internal"}
        </p>
        <h2 className="font-heading pb-4 text-4xl font-extrabold md:text-5xl">
          {t?.title || "New Comers"}
        </h2>

        <p className="text-muted-foreground pb-8">
          {t?.subtitle || "Welcome on board"}
        </p>

        <Link href={joinHref}>
          <Button size="lg" className="rounded-full py-6">
            {t?.button || "Onboarding"}
          </Button>
        </Link>
      </div>
    </section>
  )
}
