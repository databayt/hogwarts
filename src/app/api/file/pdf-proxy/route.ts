// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { NextRequest } from "next/server"

// Same-origin proxy for PDF bytes so the client-side pdf.js thumbnail renderer
// can fetch a document without tripping S3/CDN CORS. Locked to our own upload
// bucket + CDN hosts (derived from env) so it can never be used as an open
// SSRF proxy for arbitrary URLs.
function getAllowedHosts(): string[] {
  const hosts = new Set<string>()
  const bucket = process.env.AWS_S3_BUCKET
  const region = process.env.AWS_REGION || "us-east-1"
  if (bucket) {
    hosts.add(`${bucket}.s3.${region}.amazonaws.com`)
    hosts.add(`${bucket}.s3.amazonaws.com`)
  }
  for (const domain of [
    process.env.CLOUDFRONT_DOMAIN,
    process.env.NEXT_PUBLIC_CDN_DOMAIN,
  ]) {
    if (domain)
      hosts.add(domain.replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
  }
  return [...hosts]
}

export async function GET(req: NextRequest): Promise<Response> {
  const target = req.nextUrl.searchParams.get("url")
  if (!target) return new Response("Missing url", { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    return new Response("Invalid url", { status: 400 })
  }

  if (parsed.protocol !== "https:") {
    return new Response("Invalid protocol", { status: 400 })
  }

  const allowed = getAllowedHosts()
  if (!allowed.includes(parsed.hostname)) {
    return new Response("Host not allowed", { status: 403 })
  }

  let upstream: Response
  try {
    upstream = await fetch(parsed.toString(), { redirect: "error" })
  } catch {
    return new Response("Upstream fetch failed", { status: 502 })
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("Upstream error", { status: 502 })
  }

  const contentType = upstream.headers.get("content-type") || "application/pdf"
  return new Response(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  })
}
