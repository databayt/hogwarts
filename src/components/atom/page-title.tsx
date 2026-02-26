// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

interface PageTitleProps {
  title: string
}

export function PageTitle({ title }: PageTitleProps) {
  return <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
}
