// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { MetadataRoute } from "next"
import { headers } from "next/headers"

import { getSubdomainFromHost } from "@/lib/root-domain"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"

/**
 * `/manifest.webmanifest` — one per tenant.
 *
 * The proxy never sees this request (its matcher skips every dotted path), so
 * there is no `x-subdomain` or `x-locale` header to read. The route resolves
 * the school from the Host itself. Because the browser fetches the manifest on
 * the tenant origin, a relative `start_url` of "/" already points at that
 * school — no absolute origin needed.
 *
 * Reading `headers()` makes this route dynamic; the app runs on an always-on
 * container, so that is one cheap lookup per install check, cached by
 * getSchoolBySubdomain.
 *
 * Install criteria (Chrome): explicit 192 and 512 PNG icons — `sizes: "any"`
 * does not count — a same-origin start_url, and `display: standalone`.
 */

type Lang = "ar" | "en"

const COPY: Record<Lang, { name: string; description: string; quick: string; qr: string }> = {
  ar: {
    name: "بلقلم",
    description: "إدارة المدرسة: الحضور، الجداول، الدرجات، وبوابة أولياء الأمور",
    quick: "التحضير السريع",
    qr: "مسح رمز الحضور",
  },
  en: {
    name: "balqalam",
    description: "School management: attendance, timetables, grades, and the parent portal",
    quick: "Quick attendance",
    qr: "Scan attendance QR",
  },
}

const HOUSE_ICONS: NonNullable<MetadataRoute.Manifest["icons"]> = [
  { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
  { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
]

const DEFAULT_THEME = "#3b82f6"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const host = (await headers()).get("host")
  const subdomain = getSubdomainFromHost(host)

  let school: {
    name?: string | null
    nameEn?: string | null
    logoUrl?: string | null
    preferredLanguage?: string | null
    branding?: { primaryColor?: string | null } | null
  } | null = null

  if (subdomain) {
    const result = await getSchoolBySubdomain(subdomain)
    if (result.success) school = result.data
  }

  const lang: Lang = school?.preferredLanguage === "en" ? "en" : "ar"
  const copy = COPY[lang]
  const schoolName =
    (lang === "ar" ? school?.name || school?.nameEn : school?.nameEn || school?.name) ?? null
  const name = schoolName ? `${schoolName} · ${copy.name}` : copy.name
  const shortName = (schoolName ?? copy.name).slice(0, 12)
  const themeColor = /^#[0-9a-f]{6}$/i.test(school?.branding?.primaryColor ?? "")
    ? (school!.branding!.primaryColor as string)
    : DEFAULT_THEME

  return {
    name,
    short_name: shortName,
    description: copy.description,
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: themeColor,
    categories: ["education", "productivity"],
    prefer_related_applications: false,
    icons: [
      ...HOUSE_ICONS,
      // The school's own logo, when set, as an extra choice for launchers that
      // accept unsized icons. The house icons above satisfy the install check.
      ...(school?.logoUrl ? [{ src: school.logoUrl, sizes: "any" }] : []),
    ],
    shortcuts: [
      {
        name: copy.quick,
        // Teachers land on the quick-marking surface at the attendance index.
        url: "/attendance",
        icons: [{ src: "/icon-96.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: copy.qr,
        url: "/attendance/qr-code",
        icons: [{ src: "/icon-96.png", sizes: "96x96", type: "image/png" }],
      },
    ],
  }
}
