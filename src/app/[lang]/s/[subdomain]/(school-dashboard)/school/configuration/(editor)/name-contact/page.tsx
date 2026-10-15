// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { db } from "@/lib/db"
import {
  NAME_CONTACT_DEFAULTS,
  type NameContact,
  type NameContactListing,
} from "@/lib/name-utils"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigNameContactForm } from "@/components/school-dashboard/school/configuration/config-name-contact-form"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.school?.schoolAdmin?.configSections?.["name-contact"]
        ?.title || "Configuration: Contact Under Name",
  }
}

function asNameContact(
  value: string | null | undefined,
  listing: NameContactListing
): NameContact {
  return value === "email" || value === "phone"
    ? value
    : NAME_CONTACT_DEFAULTS[listing]
}

export default async function NameContactPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  const school = schoolId
    ? await db.school
        .findUnique({
          where: { id: schoolId },
          select: {
            teacherNameContact: true,
            studentNameContact: true,
            guardianNameContact: true,
            staffNameContact: true,
            memberNameContact: true,
          },
        })
        .catch(() => null)
    : null

  return (
    <ConfigNameContactForm
      schoolId={schoolId || ""}
      initial={{
        teacher: asNameContact(school?.teacherNameContact, "teacher"),
        student: asNameContact(school?.studentNameContact, "student"),
        guardian: asNameContact(school?.guardianNameContact, "guardian"),
        staff: asNameContact(school?.staffNameContact, "staff"),
        member: asNameContact(school?.memberNameContact, "member"),
      }}
      dictionary={dictionary}
    />
  )
}
