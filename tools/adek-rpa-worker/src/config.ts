// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export interface WorkerConfig {
  apiBase: string
  apiToken: string
  workerId: string
  pollIntervalMs: number
  esisLoginUrl: string
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`[adek-rpa-worker] Missing env var ${name}`)
  }
  return value
}

export function loadConfig(): WorkerConfig {
  return {
    apiBase: required("HOGWARTS_API_BASE").replace(/\/$/, ""),
    apiToken: required("HOGWARTS_API_TOKEN"),
    workerId: process.env.WORKER_ID ?? "adek-rpa-worker-local",
    pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? "30000"),
    esisLoginUrl:
      process.env.ESIS_LOGIN_URL ?? "https://esis.adek.gov.ae/login",
  }
}
