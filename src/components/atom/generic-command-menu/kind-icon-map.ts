// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  Bus,
  Calendar,
  CreditCard,
  DoorOpen,
  GraduationCap,
  IdCard,
  Map as MapIcon,
  Megaphone,
  Receipt,
  Route as RouteIcon,
  ScrollText,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react"

import type { SpotlightGroupKind } from "./types"

/**
 * Map each spotlight entity kind to a lucide icon. Used by both the dynamic
 * result row and the recents renderer (when the original entity icon needs
 * to be re-instantiated from a serialized `iconKey`).
 *
 * Keep keys in sync with `SpotlightGroupKind` — the type system enforces
 * exhaustiveness so a new kind cannot ship without a paired icon.
 */
export const kindIconMap: Record<SpotlightGroupKind, LucideIcon> = {
  student: GraduationCap,
  teacher: UserCheck,
  guardian: Users,
  class: ScrollText,
  classroom: DoorOpen,
  subject: ScrollText,
  vehicle: Bus,
  driver: IdCard,
  route: RouteIcon,
  application: ScrollText,
  payment: CreditCard,
  invoice: Receipt,
  book: MapIcon,
  announcement: Megaphone,
  event: Calendar,
}
