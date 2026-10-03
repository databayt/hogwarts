// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The boundary that lets "+" prefetch the wizard shell. Without it the
 * nearest loading.tsx is the list's, so a prefetch carried nothing useful and
 * the click flashed the table skeleton. The wizard layout renders its steps
 * itself (WizardLayout `steps`), so there is nothing to show here.
 */
export default function Loading() {
  return null
}
