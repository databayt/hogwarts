// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getTranscripts } from "../actions/transcripts"
import { TranscriptsTable } from "./table"

export async function TranscriptsContent() {
  const transcripts = await getTranscripts()
  return <TranscriptsTable initialData={transcripts} />
}
