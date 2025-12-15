import { auth } from "@/auth"

import { db } from "@/lib/db"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import { DomainRequestForm } from "./form"

interface DomainRequestContentProps {
  dictionary: Dictionary
  lang: Locale
}

export async function DomainRequestContent({
  dictionary,
  lang,
}: DomainRequestContentProps) {
  const session = await auth()

  if (!session?.user?.schoolId) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          Please sign in to manage domain requests.
        </p>
      </div>
    )
  }

  // Get current school domain
  const school = await db.school.findUnique({
    where: { id: session.user.schoolId },
    select: { domain: true },
  })

  // Get existing domain requests
  const domainRequests = await db.domainRequest.findMany({
    where: { schoolId: session.user.schoolId },
    orderBy: { createdAt: "desc" },
  })

  return (
    <DomainRequestForm
      currentDomain={school?.domain}
      existingRequests={domainRequests}
      dictionary={dictionary}
      lang={lang}
    />
  )
}
