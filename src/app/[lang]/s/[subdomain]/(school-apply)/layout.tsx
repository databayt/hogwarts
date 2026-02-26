// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

interface ApplyLayoutProps {
  children: React.ReactNode
}

export default function SchoolApplyLayout({ children }: ApplyLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex w-full flex-1 items-center px-4 sm:px-6 md:px-12 lg:px-20">
        {children}
      </main>
    </div>
  )
}
