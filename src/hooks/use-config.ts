// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"

type Config = {
  style: "new-york-v4"
  packageManager: "npm" | "yarn" | "pnpm" | "bun"
  installationType: "cli" | "manual"
}

const configAtom = atomWithStorage<Config>("config", {
  style: "new-york-v4",
  packageManager: "pnpm",
  installationType: "cli",
})

export function useConfig() {
  return useAtom(configAtom)
}
