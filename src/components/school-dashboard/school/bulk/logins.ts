// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { LoginCredential } from "./engine/types"
import type { BulkText } from "./text"

/** Excel/Sheets run a leading = + - @ as a formula — neutralise it. */
function csvCell(value: string): string {
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value
  return `"${guarded.replace(/"/g, '""')}"`
}

export function downloadLogins(
  credentials: LoginCredential[],
  fileBase: string,
  t: BulkText
) {
  const roles = t.roles as Record<string, string>
  const lines = [
    [
      t.dialog.name,
      t.fields.email,
      t.slips.username,
      t.slips.password,
      t.slips.role,
    ]
      .map(csvCell)
      .join(","),
    ...credentials.map((c) =>
      [c.name, c.email ?? "", c.username, c.password, roles[c.role] ?? c.role]
        .map(csvCell)
        .join(",")
    ),
  ]
  // BOM: Excel opens UTF-8 Arabic correctly only with it.
  const blob = new Blob(["﻿" + lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${fileBase}-logins.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Open the print window synchronously (inside the click) so popup blockers
 * allow it; fill it once the logins arrive.
 */
export function openPrintWindow(): Window | null {
  const w = window.open("", "_blank")
  w?.document.write("<p style='font-family:system-ui;padding:24px'>…</p>")
  return w
}

export async function printSlips(
  w: Window,
  credentials: LoginCredential[],
  t: BulkText,
  opts: { lang: string; loginUrl: string; schoolName?: string }
) {
  const QRCode = (await import("qrcode")).default
  const qr = await QRCode.toDataURL(opts.loginUrl, { margin: 0, width: 160 })
  const roles = t.roles as Record<string, string>
  const dir = opts.lang === "ar" ? "rtl" : "ltr"

  const cards = credentials
    .map(
      (c) => `
      <article class="slip">
        <header>
          <div>
            <h2>${escapeHtml(c.name)}</h2>
            <p class="muted">${escapeHtml(roles[c.role] ?? c.role)}${opts.schoolName ? ` · ${escapeHtml(opts.schoolName)}` : ""}</p>
          </div>
          <img src="${qr}" alt="" />
        </header>
        <dl>
          <dt>${escapeHtml(t.slips.username)}</dt><dd dir="ltr">${escapeHtml(c.username)}</dd>
          <dt>${escapeHtml(t.slips.password)}</dt><dd dir="ltr">${escapeHtml(c.password)}</dd>
          <dt>${escapeHtml(t.slips.signIn)}</dt><dd dir="ltr" class="url">${escapeHtml(opts.loginUrl.replace(/^https?:\/\//, ""))}</dd>
        </dl>
        <p class="muted note">${escapeHtml(t.slips.note)}</p>
      </article>`
    )
    .join("")

  w.document.open()
  w.document.write(`<!doctype html>
<html lang="${opts.lang}" dir="${dir}"><head><meta charset="utf-8" />
<title>${escapeHtml(t.slips.title)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 12mm; font-family: system-ui, -apple-system, "Segoe UI", Tahoma, sans-serif; color: #111; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
  .slip { border: 1px dashed #999; border-radius: 6px; padding: 5mm; break-inside: avoid; page-break-inside: avoid; }
  header { display: flex; justify-content: space-between; gap: 4mm; align-items: flex-start; }
  h2 { margin: 0 0 1mm; font-size: 15px; }
  img { width: 22mm; height: 22mm; }
  .muted { color: #666; font-size: 11px; margin: 0; }
  dl { display: grid; grid-template-columns: auto 1fr; gap: 1.5mm 4mm; margin: 4mm 0 2mm; font-size: 12px; }
  dt { color: #666; }
  dd { margin: 0; font-family: ui-monospace, Menlo, monospace; font-size: 13px; text-align: start; overflow-wrap: anywhere; }
  dd.url { font-size: 11px; }
  .note { margin-top: 2mm; }
  @media print { body { padding: 8mm; } }
</style></head>
<body><div class="grid">${cards}</div>
<script>window.onload = () => setTimeout(() => window.print(), 200)</script>
</body></html>`)
  w.document.close()
}
