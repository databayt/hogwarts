// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Mock for server-only module
 *
 * The `server-only` package throws at import time when loaded
 * outside a React Server Component context. This mock provides
 * a no-op replacement for Vitest tests.
 *
 * @see vitest.config.mts - alias configuration
 */

// Intentionally empty - server-only is a guard that has no exports
