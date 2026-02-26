// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function BillingLayout({ children }: Props) {
  return <>{children}</>
}
