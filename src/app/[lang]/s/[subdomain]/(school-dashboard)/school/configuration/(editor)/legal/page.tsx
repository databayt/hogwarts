// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { auth } from "@/auth"
import { CheckCircle2, Gavel, ShieldCheck } from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Card } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigDangerZone } from "@/components/school-dashboard/school/configuration/config-danger-zone"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.school?.schoolAdmin?.configSections?.legal?.title ||
      "Configuration: Legal",
  }
}

export default async function LegalPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const t = dictionary?.school?.configuration?.legal
  const { schoolId } = await getTenantContext()
  const session = await auth()

  // Switching the school off is DEVELOPER-only (the action enforces it too).
  const canToggleActive = session?.user?.role === "DEVELOPER" && !!schoolId
  const school = canToggleActive
    ? await db.school
        .findUnique({
          where: { id: schoolId! },
          select: { isActive: true },
        })
        .catch(() => null)
    : null

  const items = [
    {
      icon: ShieldCheck,
      title: t?.licensing?.title ?? "Licensing & Registration",
      description:
        t?.licensing?.description ??
        "Ensure your school has valid operating licenses and meets local education authority requirements.",
    },
    {
      icon: CheckCircle2,
      title: t?.safety?.title ?? "Safety Compliance",
      description:
        t?.safety?.description ??
        "CCTV surveillance, emergency alarm systems, and transportation safety standards.",
    },
    {
      icon: Gavel,
      title: t?.policies?.title ?? "Terms & Policies",
      description:
        t?.policies?.description ??
        "Terms of service, privacy policy, and fee structure documentation for parents and students.",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-semibold">{t?.title ?? "Legal & Compliance"}</h3>
        <p className="text-muted-foreground text-sm">
          {t?.description ??
            "Review your school's compliance status and ensure all legal requirements are met."}
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.title} className="flex items-start gap-4 p-4">
            <div className="bg-muted flex-shrink-0 rounded-full p-2">
              <item.icon className="text-muted-foreground h-5 w-5" />
            </div>
            <div>
              <h5 className="text-sm font-medium">{item.title}</h5>
              <p className="text-muted-foreground mt-1 text-xs">
                {item.description}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {canToggleActive && school ? (
        <ConfigDangerZone
          schoolId={schoolId!}
          isActive={school.isActive}
          t={dictionary.schoolBilling}
        />
      ) : null}
    </div>
  )
}
