// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

interface TourStandaloneLayoutProps {
  children: React.ReactNode
}

export default function TourStandaloneLayout({
  children,
}: Readonly<TourStandaloneLayoutProps>) {
  return <main className="h-dvh">{children}</main>
}
