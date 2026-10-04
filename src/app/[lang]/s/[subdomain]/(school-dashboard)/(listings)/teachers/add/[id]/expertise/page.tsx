// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import ExpertiseContent from "@/components/school-dashboard/listings/teachers/wizard/expertise/content"

// The Subjects & sections data loads in the browser when the wizard opens
// (listings/teachers/subjects/prefetch.tsx) — this page never blocks on it.
export default function ExpertisePage() {
  return <ExpertiseContent />
}
