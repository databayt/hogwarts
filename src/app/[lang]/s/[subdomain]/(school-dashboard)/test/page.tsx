// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  params: Promise<{ subdomain: string; lang: Locale }>
}

export default async function Test({ params }: Props) {
  const { subdomain, lang } = await params
  const dictionary = await getDictionary(lang)

  try {
    const result = await getSchoolBySubdomain(subdomain)

    return (
      <div className="space-y-4">
        <h3>Subdomain Test Page</h3>
        <div className="space-y-4">
          <div>
            <strong>Subdomain:</strong> {subdomain}
          </div>
          <div>
            <strong>Result:</strong> {JSON.stringify(result, null, 2)}
          </div>
          {result.success && result.data && (
            <div>
              <strong>School Name:</strong> {result.data.name}
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="space-y-4">
        <h3>Error</h3>
        <pre className="text-red-600">{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }
}
