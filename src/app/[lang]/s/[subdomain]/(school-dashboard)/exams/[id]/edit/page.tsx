// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ lang: string; subdomain: string; id: string }>
}

export default async function EditExamPage({ params }: Props) {
  const { id } = await params
  redirect(`/exams/manage/add/${id}/information`)
}
