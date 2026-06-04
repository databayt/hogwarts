// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getTranscripts } from "../actions/transcripts"
import { TranscriptsTable } from "./table"

export async function TranscriptsContent({
  dictionary,
}: {
  dictionary: Dictionary
}) {
  const transcripts = await getTranscripts()
  return <TranscriptsTable initialData={transcripts} dictionary={dictionary} />
}
