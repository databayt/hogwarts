"use client"

import { cn } from "@/lib/utils"

import { PersonGlyph } from "../ios-chat-row"
import { IosTabPage } from "../ios-tab-page"

type Row = {
  id: string
  label: string
  /** A 24px glyph. Lucide, because the WhatsApp icon set has no settings
      glyphs — the rows lead into this app, not into WhatsApp. */
  icon: React.ReactNode
  onClick?: () => void
}

type Props = {
  title: string
  name: string
  /** The line under the name — the user's own bio, or their role. */
  status?: string | null
  avatarUrl?: string | null
  groups: Row[][]
}

/**
 * The Settings tab: a profile card over grouped rows, the shape the reference
 * draws. Every row leads somewhere that already exists in this app — there are
 * no settings of its own behind it.
 */
export function SettingsView({
  title,
  name,
  status,
  avatarUrl,
  groups,
}: Props) {
  return (
    <IosTabPage
      title={title}
      className="bg-[color:var(--wa-surface-cta-filters)]"
    >
      <div className="px-[16px]">
        <div className="overflow-hidden rounded-[10px] bg-[color:var(--wa-surface-primary)]">
          <div className="flex items-center gap-[12px] px-[14px] py-[12px]">
            <span className="flex size-[56px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--wa-surface-avatar-person)]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="size-full object-cover"
                  draggable={false}
                />
              ) : (
                <PersonGlyph className="size-[30px] text-[color:var(--wa-text-avatar-person)]" />
              )}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[19px] leading-[24px] font-semibold tracking-[-0.38px] text-[color:var(--wa-text-primary)]">
                {name}
              </span>
              {status ? (
                <span className="truncate text-[15px] leading-[20px] text-[color:var(--wa-text-secondary)]">
                  {status}
                </span>
              ) : null}
            </span>
          </div>
        </div>
      </div>

      {groups.map((group, i) => (
        <div key={i} className="px-[16px] pt-[22px]">
          <div className="overflow-hidden rounded-[10px] bg-[color:var(--wa-surface-primary)]">
            {group.map((row, j) => (
              <button
                key={row.id}
                type="button"
                onClick={row.onClick}
                className="flex w-full items-center gap-[14px] ps-[14px] text-start active:bg-black/5"
              >
                <span className="flex size-[24px] shrink-0 items-center justify-center text-[color:var(--wa-text-primary)]">
                  {row.icon}
                </span>
                <span
                  className={cn(
                    "flex flex-1 items-center justify-between py-[13px] pe-[14px]",
                    j < group.length - 1 &&
                      "border-b-[0.33px] border-[color:var(--wa-border-separator)]"
                  )}
                >
                  <span className="truncate text-[17px] leading-[22px] tracking-[-0.34px] text-[color:var(--wa-text-primary)]">
                    {row.label}
                  </span>
                  <Chevron />
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </IosTabPage>
  )
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 12 20"
      className="size-[14px] shrink-0 text-[color:var(--wa-text-secondary)] rtl:scale-x-[-1]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="2 2 10 10 2 18" />
    </svg>
  )
}
