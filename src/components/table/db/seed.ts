// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { seedTasks } from "@/components/table/_lib/actions"

async function runSeed() {
  console.log("⏳ Running seed...")

  const start = Date.now()

  await seedTasks({ count: 100 })

  const end = Date.now()

  console.log(`✅ Seed completed in ${end - start}ms`)

  process.exit(0)
}

runSeed().catch((err) => {
  console.error("❌ Seed failed")
  console.error(err)
  process.exit(1)
})
