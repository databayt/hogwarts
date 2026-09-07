// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

// One Prisma singleton for the whole app. A second `new PrismaClient()` here
// would need its own driver adapter on Cloudflare Workers (see src/lib/db.ts);
// re-exporting keeps the pricing block on the shared, adapter-aware client.
export { db as prisma } from "@/lib/db"
