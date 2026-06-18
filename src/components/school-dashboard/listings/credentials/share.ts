// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * "Direct best channel" share link builder for the credentials dialog.
 *
 * The admin's goal is to hand the freshly-minted login to the right person.
 * Instead of a strip of channel buttons, we detect what contact is actually on
 * file and pick ONE channel:
 *
 *   - a phone on file  → WhatsApp (wa.me) prefilled to that number
 *   - else an email    → mailto: prefilled to that address
 *   - else nothing     → null (the share icon renders disabled)
 *
 * We never guess a country code: a number stored without one (a bare national
 * number) is passed through as-is. wa.me may not resolve it, but inventing a
 * country prefix risks messaging a wrong person — the copy fallback covers it.
 */
export type ShareChannelKind = "whatsapp" | "email"

export interface ShareChannel {
  kind: ShareChannelKind
  /** Ready-to-open href (wa.me or mailto). */
  href: string
}

export interface BuildShareInput {
  phone: string | null
  email: string | null
  /** Fully rendered message body (credentials + login URL). */
  message: string
  /** Subject line — used by the email channel only. */
  subject: string
}

/** Reduce a stored phone to wa.me digits: strip spaces/punctuation and a
 *  leading `+` or international `00` prefix. Returns null when nothing usable
 *  (too short to be a real number) remains. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  let d = raw.replace(/[^\d+]/g, "")
  if (d.startsWith("+")) d = d.slice(1)
  if (d.startsWith("00")) d = d.slice(2)
  d = d.replace(/\D/g, "")
  return d.length >= 8 ? d : null
}

/**
 * Pick the single best share channel for the given contact info, or null when
 * neither a usable phone nor an email is available.
 */
export function buildShareLink(input: BuildShareInput): ShareChannel | null {
  const phone = normalizePhone(input.phone)
  if (phone) {
    return {
      kind: "whatsapp",
      href: `https://wa.me/${phone}?text=${encodeURIComponent(input.message)}`,
    }
  }
  if (input.email) {
    return {
      kind: "email",
      href: `mailto:${encodeURIComponent(input.email)}?subject=${encodeURIComponent(
        input.subject
      )}&body=${encodeURIComponent(input.message)}`,
    }
  }
  return null
}

/** Replace `{token}` placeholders in a template string. */
export function fillTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.split(`{${k}}`).join(v),
    template
  )
}
