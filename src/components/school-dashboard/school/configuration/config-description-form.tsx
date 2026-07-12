"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import {
  BookOpen,
  Building2,
  Globe,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Layers,
  School,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { ErrorToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { updateSchoolDescription } from "@/components/onboarding/description/actions"
import type { DescriptionFormData } from "@/components/onboarding/description/validation"

type SchoolType = NonNullable<DescriptionFormData["schoolType"]>
type SchoolLevel = NonNullable<DescriptionFormData["schoolLevel"]>

interface Props {
  schoolId: string
  initialData: {
    schoolType?: SchoolType
    schoolLevel?: SchoolLevel
  }
  dictionary?: Dictionary
}

export function ConfigDescriptionForm({
  schoolId,
  initialData,
  dictionary,
}: Props) {
  const [schoolType, setSchoolType] = useState<SchoolType | undefined>(
    initialData.schoolType
  )
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel | undefined>(
    initialData.schoolLevel
  )
  const [isPending, startTransition] = useTransition()

  const dict = ((dictionary?.school as Record<string, unknown> | undefined)
    ?.onboarding ?? {}) as Record<string, string>
  const cfg = ((dictionary?.school as Record<string, unknown> | undefined)
    ?.configuration ?? {}) as Record<string, string>

  // Persist changes optimistically. Technical schools are secondary-only
  // by definition; force the level so downstream fee-provisioning sees a
  // complete profile (mirrors onboarding form behavior).
  const persist = (next: {
    schoolType?: SchoolType
    schoolLevel?: SchoolLevel
  }) => {
    const resolvedType = next.schoolType ?? schoolType
    if (!resolvedType) return
    const payload: DescriptionFormData = {
      schoolType: resolvedType,
      schoolLevel:
        next.schoolType === "technical"
          ? "secondary"
          : (next.schoolLevel ?? schoolLevel),
    }
    startTransition(async () => {
      const result = await updateSchoolDescription(schoolId, payload)
      if (!result.success) {
        ErrorToast(dict.unexpectedError || "Error")
      }
    })
  }

  const handleType = (id: SchoolType) => {
    setSchoolType(id)
    if (id === "technical") setSchoolLevel("secondary")
    persist({ schoolType: id })
  }

  const handleLevel = (id: SchoolLevel) => {
    setSchoolLevel(id)
    persist({ schoolLevel: id })
  }

  const types: Array<{ id: SchoolType; title: string; icon: LucideIcon }> = [
    { id: "private", title: dict.privateSchool, icon: Building2 },
    { id: "public", title: dict.publicSchool, icon: Landmark },
    { id: "international", title: dict.internationalSchool, icon: Globe },
    { id: "technical", title: dict.technicalSchool, icon: Wrench },
    { id: "special", title: dict.specialSchool, icon: HeartHandshake },
  ]

  const levels: Array<{
    id: SchoolLevel
    title: string
    subtitle: string
    icon: LucideIcon
  }> = [
    {
      id: "primary",
      title: dict.primaryLevel,
      subtitle: dict.primaryGrades,
      icon: School,
    },
    {
      id: "middle",
      title: dict.middleLevel,
      subtitle: dict.middleGrades,
      icon: BookOpen,
    },
    {
      id: "secondary",
      title: dict.secondaryLevel,
      subtitle: dict.secondaryGrades,
      icon: GraduationCap,
    },
    {
      id: "both",
      title: dict.bothLevels,
      subtitle: dict.bothGrades,
      icon: Layers,
    },
  ]

  // Technical = secondary-only, so the level section is locked to one option.
  const levelDisabled = schoolType === "technical"

  return (
    <div className="space-y-8">
      <Section label={cfg.type || dict.type || "Type"}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {types.map((t) => (
            <OptionRow
              key={t.id}
              icon={t.icon}
              title={t.title}
              selected={schoolType === t.id}
              disabled={isPending}
              onClick={() => handleType(t.id)}
            />
          ))}
        </div>
      </Section>

      <Section label={cfg.level || dict.level || "Level"}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {levels.map((l) => (
            <OptionRow
              key={l.id}
              icon={l.icon}
              title={l.title}
              subtitle={l.subtitle}
              selected={schoolLevel === l.id}
              disabled={isPending || (levelDisabled && l.id !== "secondary")}
              onClick={() => handleLevel(l.id)}
            />
          ))}
        </div>
      </Section>
    </div>
  )
}

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      {children}
    </div>
  )
}

function OptionRow({
  icon: Icon,
  title,
  subtitle,
  selected,
  disabled,
  onClick,
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  selected: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "hover:border-foreground/50 flex w-full items-center gap-3 rounded-lg border p-3 text-start transition-all",
        "disabled:cursor-not-allowed disabled:opacity-60",
        selected ? "border-foreground bg-accent" : "border-border"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-medium">{title}</span>
        {subtitle && (
          <span className="text-muted-foreground text-xs">{subtitle}</span>
        )}
      </div>
    </button>
  )
}
