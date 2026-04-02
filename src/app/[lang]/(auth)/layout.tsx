// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ReportIssue } from "@/components/report-issue"

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative mx-auto flex h-screen max-w-md items-center justify-center px-6">
      {children}
      <div className="text-muted-foreground absolute bottom-4 start-6 text-sm">
        <ReportIssue />
      </div>
    </div>
  )
}

export default AuthLayout
