// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import ExpertiseContent from "@/components/school-dashboard/listings/teachers/wizard/expertise/content"

// The grade/subject catalogue loads in the browser when the wizard opens
// (expertise/resources.tsx) — this page no longer blocks on it.
export default function ExpertisePage() {
  return <ExpertiseContent />
}
