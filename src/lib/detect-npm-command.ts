// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Pure helper that detects npm-style commands and returns the equivalent
 * commands for yarn, pnpm, and bun. Returns null if the code isn't a
 * recognized package-manager command.
 *
 * Replaces the shiki transformer in `src/lib/highlight-code.ts` so the same
 * package-manager-tab feature works without invoking shiki at build time.
 * Used by `src/mdx-components.tsx`'s `pre` override to decide whether to
 * render `<CodeBlockCommand>` or `<DynamicCodeBlock>`.
 */
export type NpmCommand = {
  __npm__: string
  __yarn__: string
  __pnpm__: string
  __bun__: string
}

export function detectNpmCommand(code: string): NpmCommand | null {
  const raw = code.trim()

  if (raw.startsWith("npm install")) {
    return {
      __npm__: raw,
      __yarn__: raw.replace("npm install", "yarn add"),
      __pnpm__: raw.replace("npm install", "pnpm add"),
      __bun__: raw.replace("npm install", "bun add"),
    }
  }

  if (raw.startsWith("npx create-")) {
    return {
      __npm__: raw,
      __yarn__: raw.replace("npx create-", "yarn create "),
      __pnpm__: raw.replace("npx create-", "pnpm create "),
      __bun__: raw.replace("npx", "bunx --bun"),
    }
  }

  if (raw.startsWith("npm create")) {
    return {
      __npm__: raw,
      __yarn__: raw.replace("npm create", "yarn create"),
      __pnpm__: raw.replace("npm create", "pnpm create"),
      __bun__: raw.replace("npm create", "bun create"),
    }
  }

  if (raw.startsWith("npx")) {
    return {
      __npm__: raw,
      __yarn__: raw.replace("npx", "yarn"),
      __pnpm__: raw.replace("npx", "pnpm dlx"),
      __bun__: raw.replace("npx", "bunx --bun"),
    }
  }

  if (raw.startsWith("npm run")) {
    return {
      __npm__: raw,
      __yarn__: raw.replace("npm run", "yarn"),
      __pnpm__: raw.replace("npm run", "pnpm"),
      __bun__: raw.replace("npm run", "bun"),
    }
  }

  return null
}
