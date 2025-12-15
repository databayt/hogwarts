"use client"

import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useSchool } from "@/components/platform/context/school-context"

interface DashboardClientProps {
  dictionary?: Dictionary["school"]
}

export function DashboardClient({ dictionary }: DashboardClientProps) {
  const { school } = useSchool()

  // Use school data from context
  const schoolName = school?.name || "Your School"

  const dashboardDict = dictionary?.dashboard || {
    title: "Dashboard",
    welcome: "Welcome to Hogwarts",
  }

  return (
    <div className="text-muted-foreground">
      <p>{dashboardDict.welcome.replace("Hogwarts", schoolName)}</p>
      <p>School Domain: {school?.domain}</p>
      <p>School ID: {school?.id}</p>
    </div>
  )
}
