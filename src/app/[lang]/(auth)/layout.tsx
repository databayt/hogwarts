// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ReportIssue } from "@/components/report-issue"

// Auth pages use cookies/headers - always dynamic
export const dynamic = "force-dynamic"

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative mx-auto flex h-screen max-w-md items-center justify-center px-6">
      {children}
      <div className="text-muted-foreground absolute start-6 bottom-4 text-sm">
        <ReportIssue />
      </div>
    </div>
  )
}

export default AuthLayout
