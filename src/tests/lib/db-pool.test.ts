// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { describe, expect, it } from "vitest"

import {
  DEFAULT_POOL_SIZE,
  DEFAULT_POOL_TIMEOUT_S,
  withPoolParams,
} from "@/lib/db-pool"

const POOLED =
  "postgresql://owner:p%40ss%2Fw0rd@ep-x-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=15"

describe("withPoolParams", () => {
  it("adds a pool size and a wait to the production-shaped URL", () => {
    const out = withPoolParams(POOLED, {})
    expect(out).toBe(
      `${POOLED}&connection_limit=${DEFAULT_POOL_SIZE}&pool_timeout=${DEFAULT_POOL_TIMEOUT_S}`
    )
  })

  it("leaves the password and the rest of the query byte for byte", () => {
    const out = withPoolParams(POOLED, {})!
    expect(out.startsWith(POOLED)).toBe(true)
    expect(out).toContain("p%40ss%2Fw0rd")
  })

  it("starts a query string when the URL has none", () => {
    expect(withPoolParams("postgres://u:p@localhost:5432/hogwarts", {})).toBe(
      `postgres://u:p@localhost:5432/hogwarts?connection_limit=${DEFAULT_POOL_SIZE}&pool_timeout=${DEFAULT_POOL_TIMEOUT_S}`
    )
  })

  it("a URL that already sets connection_limit wins", () => {
    const url = `${POOLED}&connection_limit=4`
    const out = withPoolParams(url, { DB_POOL_SIZE: "30" })!
    expect(out).toContain("connection_limit=4")
    expect(out).not.toContain("connection_limit=30")
    expect(out).toContain(`pool_timeout=${DEFAULT_POOL_TIMEOUT_S}`)
  })

  it("DB_POOL_SIZE and DB_POOL_TIMEOUT override the defaults", () => {
    const out = withPoolParams(POOLED, {
      DB_POOL_SIZE: "25",
      DB_POOL_TIMEOUT: "30",
    })!
    expect(out).toContain("connection_limit=25")
    expect(out).toContain("pool_timeout=30")
  })

  it("ignores a nonsense override", () => {
    for (const bad of ["0", "-3", "abc", "1.5", "9999", ""]) {
      const out = withPoolParams(POOLED, { DB_POOL_SIZE: bad })!
      expect(out).toContain(`connection_limit=${DEFAULT_POOL_SIZE}`)
    }
  })

  it("does not mistake a similarly named parameter for the real one", () => {
    const out = withPoolParams(`${POOLED}&my_connection_limit=2`, {})!
    expect(out).toContain(`&connection_limit=${DEFAULT_POOL_SIZE}`)
  })

  it("returns anything that is not a Postgres URL unchanged", () => {
    expect(withPoolParams(undefined, {})).toBeUndefined()
    expect(withPoolParams("", {})).toBe("")
    expect(withPoolParams("file:./dev.db", {})).toBe("file:./dev.db")
  })

  it("keeps a fragment at the end", () => {
    const out = withPoolParams("postgresql://u:p@h/db?sslmode=require#x", {})!
    expect(out.endsWith("#x")).toBe(true)
    expect(out).toContain("sslmode=require&connection_limit=")
  })
})
