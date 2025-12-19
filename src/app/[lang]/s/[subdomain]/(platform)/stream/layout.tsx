import { ReactNode } from "react"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { StreamHeader } from "@/components/stream/header"

interface StreamLayoutProps {
  children: ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function StreamLayout({
  children,
  params,
}: StreamLayoutProps) {
  const { lang } = await params
  const session = await auth()

  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      }
    : null

  return (
    <div className="min-h-screen">
      <StreamHeader lang={lang} user={user} />
      <main>{children}</main>
    </div>
  )
}
