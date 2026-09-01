// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { AlertTriangle, ArrowRight, Check, Minus } from "lucide-react"

import { typographyVariants } from "@/lib/typography"
import { cn } from "@/lib/utils"

import type {
  LandingPolicy,
  LandingReadiness,
  LandingSectionProps,
  LiveSettingsDictionary,
} from "./types"

interface ReadinessProps extends LandingSectionProps {
  settings: LiveSettingsDictionary
  policy: LandingPolicy
  readiness: LandingReadiness
}

type State = "ok" | "warn" | "off"

/**
 * Can this school actually teach online — answered on the page, for admins.
 *
 * Nothing in the block asked this before. Every signal already existed
 * (`getLiveKitReadiness`, `getLiveLinkCoverage`, `effectivePolicy`), but they
 * were scattered across the settings panel and the network-test page, so
 * "are we ready" meant visiting three surfaces and holding the answer in your
 * head.
 *
 * The labels come from `liveClasses.settings` — a different namespace file
 * that already carries every delivery-mode, provider and coverage string in
 * both languages. Reading them here rather than copying them into
 * `school.liveClasses` keeps one translation per phrase.
 *
 * Rendered only for ADMIN and DEVELOPER. `getLiveLinkCoverage` is itself gated
 * on `manage_settings`, so the data cannot leak even if this check regressed.
 */
export function LiveReadinessBand({
  dictionary,
  lang,
  settings,
  policy,
  readiness,
}: ReadinessProps) {
  const r = dictionary?.landing?.readiness
  const { coverage } = readiness

  const rows: Array<{
    key: string
    state: State
    label?: string
    value?: string
    href?: string
  }> = [
    {
      key: "mode",
      state: policy.isOnline ? "ok" : "off",
      label: settings?.deliveryMode,
      value: policy.windowActive
        ? settings?.windowActive
        : policy.deliveryMode === "hybrid"
          ? settings?.deliveryHybrid
          : policy.deliveryMode === "online"
            ? settings?.deliveryOnline
            : settings?.deliveryPhysical,
      href: `/${lang}/live/settings`,
    },
    {
      key: "provider",
      // Degraded is the case worth naming: the school asked for in-app rooms
      // and is silently running on external links because the SFU is not up.
      state: policy.degraded ? "warn" : "ok",
      label: settings?.provider,
      value: policy.degraded
        ? settings?.providerExternal
        : policy.provider === "livekit"
          ? settings?.providerLivekit
          : settings?.providerExternal,
      href: `/${lang}/live/settings`,
    },
    {
      key: "coverage",
      state: !coverage
        ? "off"
        : coverage.gapCount === 0
          ? "ok"
          : readiness.hasFallback
            ? "warn"
            : "warn",
      label: settings?.coverage?.title,
      value: coverage
        ? coverage.gapCount === 0
          ? settings?.coverage?.allCovered
          : `${num(lang, coverage.covered)}/${num(lang, coverage.total)}`
        : r?.unknown,
      href: `/${lang}/live/settings`,
    },
    {
      key: "recording",
      state: readiness.recordingReady ? "ok" : "off",
      label: r?.recording,
      value: readiness.recordingReady ? r?.on : r?.off,
    },
    {
      key: "network",
      state: readiness.livekitReady ? "ok" : "off",
      label: r?.network,
      value: readiness.livekitReady ? r?.ready : r?.notProvisioned,
      href: `/${lang}/live/network-test`,
    },
  ]

  return (
    <section className="mb-16">
      <div className="mb-5">
        <h2 className={typographyVariants.cardTitle}>{r?.title}</h2>
        <p className={cn(typographyVariants.hint, "mt-1 max-w-[64ch]")}>
          {r?.description}
        </p>
      </div>

      <ul className="divide-border grid grid-cols-1 divide-y rounded-xl border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5">
        {rows.map((row) => (
          <li key={row.key} className="p-4">
            <Row {...row} />
          </li>
        ))}
      </ul>

      {/* Only worth saying when it changes what happens: without a standing
          link, a section+subject pair with no room of its own materializes
          nothing at all rather than falling back to a shared one. */}
      {coverage && coverage.gapCount > 0 && !readiness.hasFallback ? (
        <p className="text-muted-foreground mt-3 text-xs">
          {r?.noFallback?.replace("{count}", num(lang, coverage.gapCount))}
        </p>
      ) : null}
    </section>
  )
}

/** Arabic-Indic digits on /ar, Latin on /en — matching the rest of the page. */
function num(lang: string, n: number): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US").format(n)
}

function Row({
  state,
  label,
  value,
  href,
}: {
  state: State
  label?: string
  value?: string
  href?: string
}) {
  const body = (
    <>
      <div className="mb-2 flex items-center gap-2">
        <StateDot state={state} />
        <span className={typographyVariants.hint}>{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium">{value}</span>
        {href ? (
          <ArrowRight
            className="text-muted-foreground size-3 opacity-0 transition-opacity group-hover:opacity-100 rtl:rotate-180"
            aria-hidden="true"
          />
        ) : null}
      </div>
    </>
  )

  return href ? (
    <Link href={href} className="group block text-start">
      {body}
    </Link>
  ) : (
    <div className="text-start">{body}</div>
  )
}

/**
 * Status uses chart tokens, not raw hex, so it inverts with the theme — and
 * carries an icon as well as a colour, because colour alone is not a signal.
 */
function StateDot({ state }: { state: State }) {
  const Icon = state === "ok" ? Check : state === "warn" ? AlertTriangle : Minus
  return (
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-full",
        state === "ok" && "bg-[var(--chart-2)]/15 text-[var(--chart-2)]",
        state === "warn" && "bg-[var(--chart-4)]/15 text-[var(--chart-4)]",
        state === "off" && "bg-muted text-muted-foreground"
      )}
    >
      <Icon className="size-2.5" strokeWidth={3} aria-hidden="true" />
    </span>
  )
}
