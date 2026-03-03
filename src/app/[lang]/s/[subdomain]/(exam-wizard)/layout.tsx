// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

interface ExamWizardLayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function ExamWizardLayout({
  children,
  params,
}: Readonly<ExamWizardLayoutProps>) {
  const { lang } = await params

  // Auth guard: only ADMIN, DEVELOPER, TEACHER can access wizards
  const session = await auth()
  const role = session?.user?.role
  if (!role || ["STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF"].includes(role)) {
    redirect(`/${lang}/exams`)
  }

  return <main className="h-dvh">{children}</main>
}
