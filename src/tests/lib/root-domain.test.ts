// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Root-domain registry tests — the host → tenant/main/cookie classification
 * shared by src/proxy.ts, src/auth.ts and the auth client components.
 *
 * The app serves multiple root domains (databayt.org, balqalam.com); these
 * tests pin the full host matrix so adding a root or touching the parser can
 * never silently break tenant routing or cookie scoping on another root.
 */
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  cookieDomainForHost,
  getRootDomain,
  getSubdomainFromHost,
  isMainDomainHost,
  mainOriginForHost,
  PRIMARY_ROOT_DOMAIN,
  ROOT_DOMAINS,
  tenantOriginForHost,
} from "@/lib/root-domain"

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("ROOT_DOMAINS registry", () => {
  it("contains both production roots with databayt.org as primary", () => {
    expect(ROOT_DOMAINS).toContain("databayt.org")
    expect(ROOT_DOMAINS).toContain("balqalam.com")
    expect(PRIMARY_ROOT_DOMAIN).toBe("databayt.org")
  })
})

describe("getRootDomain", () => {
  it("resolves hosts to their root", () => {
    expect(getRootDomain("demo.databayt.org")).toBe("databayt.org")
    expect(getRootDomain("ed.databayt.org")).toBe("databayt.org")
    expect(getRootDomain("databayt.org")).toBe("databayt.org")
    expect(getRootDomain("demo.balqalam.com")).toBe("balqalam.com")
    expect(getRootDomain("balqalam.com")).toBe("balqalam.com")
    expect(getRootDomain("www.balqalam.com")).toBe("balqalam.com")
  })

  it("normalizes case and port", () => {
    expect(getRootDomain("DEMO.BALQALAM.COM")).toBe("balqalam.com")
    expect(getRootDomain("demo.balqalam.com:443")).toBe("balqalam.com")
  })

  it("returns null for unknown hosts", () => {
    expect(getRootDomain("school.edu.sa")).toBeNull()
    expect(getRootDomain("tenant---branch.vercel.app")).toBeNull()
    expect(getRootDomain("demo.localhost:3000")).toBeNull()
    expect(getRootDomain(null)).toBeNull()
    expect(getRootDomain(undefined)).toBeNull()
    // Suffix must match on a label boundary, not substring
    expect(getRootDomain("notbalqalam.com")).toBeNull()
    expect(getRootDomain("balqalam.com.evil.io")).toBeNull()
  })
})

describe("getSubdomainFromHost", () => {
  it("extracts tenants on databayt.org (ed./www./apex are main)", () => {
    expect(getSubdomainFromHost("demo.databayt.org")).toBe("demo")
    expect(getSubdomainFromHost("kingfahad.databayt.org")).toBe("kingfahad")
    expect(getSubdomainFromHost("ed.databayt.org")).toBeNull()
    expect(getSubdomainFromHost("www.databayt.org")).toBeNull()
    expect(getSubdomainFromHost("databayt.org")).toBeNull()
  })

  it("extracts tenants on balqalam.com (apex/www are main)", () => {
    expect(getSubdomainFromHost("demo.balqalam.com")).toBe("demo")
    expect(getSubdomainFromHost("kingfahad.balqalam.com")).toBe("kingfahad")
    expect(getSubdomainFromHost("balqalam.com")).toBeNull()
    expect(getSubdomainFromHost("www.balqalam.com")).toBeNull()
  })

  it("normalizes case and port on production roots", () => {
    expect(getSubdomainFromHost("Demo.Balqalam.Com")).toBe("demo")
    expect(getSubdomainFromHost("demo.balqalam.com:443")).toBe("demo")
  })

  it("extracts tenants from Vercel preview hosts", () => {
    expect(getSubdomainFromHost("tenant---feature-x.vercel.app")).toBe("tenant")
    expect(getSubdomainFromHost("hogwarts.vercel.app")).toBeNull()
  })

  it("extracts tenants from *.localhost dev hosts", () => {
    expect(getSubdomainFromHost("demo.localhost:3000")).toBe("demo")
    expect(getSubdomainFromHost("demo.localhost")).toBe("demo")
    expect(getSubdomainFromHost("localhost:3000")).toBeNull()
    expect(getSubdomainFromHost("localhost")).toBeNull()
    expect(getSubdomainFromHost("www.localhost:3000")).toBeNull()
  })

  it("returns null for custom domains and empty hosts", () => {
    expect(getSubdomainFromHost("school.edu.sa")).toBeNull()
    expect(getSubdomainFromHost("")).toBeNull()
    expect(getSubdomainFromHost(null)).toBeNull()
    expect(getSubdomainFromHost(undefined)).toBeNull()
  })
})

describe("isMainDomainHost", () => {
  it("marks marketing/platform hosts of every root as main", () => {
    expect(isMainDomainHost("ed.databayt.org")).toBe(true)
    expect(isMainDomainHost("databayt.org")).toBe(true)
    expect(isMainDomainHost("www.databayt.org")).toBe(true)
    expect(isMainDomainHost("balqalam.com")).toBe(true)
    expect(isMainDomainHost("www.balqalam.com")).toBe(true)
    expect(isMainDomainHost("localhost:3000")).toBe(true)
    expect(isMainDomainHost("localhost")).toBe(true)
  })

  it("never marks tenants or foreign hosts as main", () => {
    expect(isMainDomainHost("demo.databayt.org")).toBe(false)
    expect(isMainDomainHost("demo.balqalam.com")).toBe(false)
    expect(isMainDomainHost("school.edu.sa")).toBe(false)
    expect(isMainDomainHost("tenant---branch.vercel.app")).toBe(false)
    expect(isMainDomainHost(null)).toBe(false)
  })
})

describe("cookieDomainForHost", () => {
  it("scopes the cookie to the root domain of the request (production)", () => {
    vi.stubEnv("NODE_ENV", "production")
    expect(cookieDomainForHost("demo.databayt.org")).toBe(".databayt.org")
    expect(cookieDomainForHost("ed.databayt.org")).toBe(".databayt.org")
    expect(cookieDomainForHost("balqalam.com")).toBe(".balqalam.com")
    expect(cookieDomainForHost("demo.balqalam.com")).toBe(".balqalam.com")
  })

  it("falls back to the primary root when the host is unknown (production)", () => {
    vi.stubEnv("NODE_ENV", "production")
    expect(cookieDomainForHost(null)).toBe(".databayt.org")
    expect(cookieDomainForHost(undefined)).toBe(".databayt.org")
  })

  it("uses host-only cookies on custom/preview domains (production)", () => {
    vi.stubEnv("NODE_ENV", "production")
    expect(cookieDomainForHost("school.edu.sa")).toBeUndefined()
    expect(cookieDomainForHost("tenant---x.vercel.app")).toBeUndefined()
  })

  it("is undefined outside production", () => {
    expect(cookieDomainForHost("demo.databayt.org")).toBeUndefined()
    expect(cookieDomainForHost("demo.balqalam.com")).toBeUndefined()
  })
})

describe("tenantOriginForHost", () => {
  it("keeps the tenant on the root domain of the current host", () => {
    expect(tenantOriginForHost("balqalam.com", "demo")).toBe(
      "https://demo.balqalam.com"
    )
    expect(tenantOriginForHost("demo.balqalam.com", "acme")).toBe(
      "https://acme.balqalam.com"
    )
    expect(tenantOriginForHost("ed.databayt.org", "demo")).toBe(
      "https://demo.databayt.org"
    )
  })

  it("falls back to the primary root for unknown hosts", () => {
    expect(tenantOriginForHost(null, "demo")).toBe("https://demo.databayt.org")
    expect(tenantOriginForHost("school.edu.sa", "demo")).toBe(
      "https://demo.databayt.org"
    )
  })

  it("uses *.localhost:3000 in development", () => {
    vi.stubEnv("NODE_ENV", "development")
    expect(tenantOriginForHost("localhost:3000", "demo")).toBe(
      "http://demo.localhost:3000"
    )
  })
})

describe("mainOriginForHost", () => {
  it("returns the marketing host of the current root", () => {
    expect(mainOriginForHost("demo.balqalam.com")).toBe("https://balqalam.com")
    expect(mainOriginForHost("balqalam.com")).toBe("https://balqalam.com")
    expect(mainOriginForHost("kingfahad.databayt.org")).toBe(
      "https://ed.databayt.org"
    )
    expect(mainOriginForHost(null)).toBe("https://ed.databayt.org")
  })

  it("uses localhost:3000 in development", () => {
    vi.stubEnv("NODE_ENV", "development")
    expect(mainOriginForHost("demo.localhost:3000")).toBe(
      "http://localhost:3000"
    )
  })
})
