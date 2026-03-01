// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { LucideIcon } from "lucide-react"
import {
  Calendar,
  Crown,
  DollarSign,
  Eye,
  Gavel,
  Globe,
  MapPin,
  Palette,
  Percent,
  School,
  Type,
  UserPlus,
  Users,
} from "lucide-react"

export interface ConfigSection {
  key: string
  icon: LucideIcon
  iconColor: string
  route: string
}

export const CONFIG_SECTIONS: ConfigSection[] = [
  {
    key: "title",
    icon: Type,
    iconColor: "text-primary",
    route: "title",
  },
  {
    key: "description",
    icon: School,
    iconColor: "text-indigo-500",
    route: "description",
  },
  {
    key: "location",
    icon: MapPin,
    iconColor: "text-red-500",
    route: "location",
  },
  {
    key: "capacity",
    icon: Users,
    iconColor: "text-blue-500",
    route: "capacity",
  },
  {
    key: "schedule",
    icon: Calendar,
    iconColor: "text-green-500",
    route: "schedule",
  },
  {
    key: "branding",
    icon: Palette,
    iconColor: "text-pink-500",
    route: "branding",
  },
  {
    key: "join",
    icon: UserPlus,
    iconColor: "text-cyan-500",
    route: "join",
  },
  {
    key: "visibility",
    icon: Eye,
    iconColor: "text-violet-500",
    route: "visibility",
  },
  {
    key: "price",
    icon: DollarSign,
    iconColor: "text-emerald-500",
    route: "price",
  },
  {
    key: "discount",
    icon: Percent,
    iconColor: "text-amber-500",
    route: "discount",
  },
  {
    key: "legal",
    icon: Gavel,
    iconColor: "text-slate-500",
    route: "legal",
  },
  {
    key: "plan",
    icon: Crown,
    iconColor: "text-yellow-500",
    route: "plan",
  },
  {
    key: "domain",
    icon: Globe,
    iconColor: "text-teal-500",
    route: "domain",
  },
]
