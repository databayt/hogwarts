// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The photo-less avatar: a tinted disc and a person silhouette, the colour
// picked by hashing a stable id. One flat colour for every photo-less person
// reads as a wall of identical discs.
//
// Plain module (no "use client"), so a Server Component can draw it too — the
// live room's teacher & students shelf does. Messaging's list, contact cards
// and chat header all read this ONE palette; it used to be three copies.

export const AVATAR_COLORS = [
  { bg: "#CBF2EE", icon: "#028377" },
  { bg: "#E9E0FF", icon: "#5D47DE" },
  { bg: "#FEF1D4", icon: "#9D6C2C" },
  { bg: "#FBD8DC", icon: "#D10335" },
]

/** Same id, same colour — on every surface and every render. */
export function getAvatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/** The person silhouette WhatsApp shows when a contact has no photo. */
export function PersonGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4.2" />
      <path d="M12 13.6c-4.1 0-7.4 2.4-7.4 5.4v1h14.8v-1c0-3-3.3-5.4-7.4-5.4Z" />
    </svg>
  )
}
