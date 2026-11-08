// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// The Arabic dictionary the SaaS marketing pages' client components get: the
// general file only (`ar.json`), not the whole merged dictionary.
//
// Every client component under the (saas-marketing) layout reads one of
// `community`, `marketing`, `platform`, `common`, `userMenu` or
// `commandMenu` — all in the general file. The full client dictionary
// (client/ar.ts) is ~1.1-1.4 MB of JSON compiled into one chunk, ~280-310 KB
// gzipped, which every marketing page downloaded and parsed on a first visit;
// this one is ~40-45 KB. A marketing client component that needs a feature
// namespace must get it as a prop from its server parent, never by widening
// this module. src/tests/i18n/marketing-dictionary.test.ts keeps it honest.

import general from "../ar.json"
import type { Dictionary } from "../dictionaries"

export const dictionary = { ...general } as unknown as Dictionary
