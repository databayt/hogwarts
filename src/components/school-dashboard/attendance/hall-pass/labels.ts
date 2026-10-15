// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  BookOpen,
  Briefcase,
  Droplet,
  HeartPulse,
  KeyRound,
  MapPin,
  MessageCircle,
  Toilet,
  type LucideIcon,
} from "lucide-react"

import type { HallPassDestination } from "./validation"

/** One icon per destination — replaces the emoji glyphs. */
export const destinationIcon: Record<HallPassDestination, LucideIcon> = {
  BATHROOM: Toilet,
  NURSE: HeartPulse,
  OFFICE: Briefcase,
  COUNSELOR: MessageCircle,
  LIBRARY: BookOpen,
  LOCKER: KeyRound,
  WATER_FOUNTAIN: Droplet,
  OTHER: MapPin,
}

export const destinationFallback: Record<HallPassDestination, string> = {
  BATHROOM: "Restroom",
  NURSE: "Nurse",
  OFFICE: "Office",
  COUNSELOR: "Counselor",
  LIBRARY: "Library",
  LOCKER: "Locker",
  WATER_FOUNTAIN: "Water fountain",
  OTHER: "Other",
}

export function destinationLabel(
  dest: HallPassDestination,
  labels: Record<string, string> | undefined
): string {
  return labels?.[dest] ?? destinationFallback[dest]
}
