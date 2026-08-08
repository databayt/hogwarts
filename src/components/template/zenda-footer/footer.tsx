// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

/**
 * Footer — rebuilt against the live zenda.com Webflow markup so the layout,
 * typography and responsive reflow come straight from the CDN stylesheet
 * (vendored into src/styles/zenda-clone.css) instead of a hand-rolled Tailwind
 * copy.
 *
 * `.footer_wrap` is a 2-col grid (`.3fr 1fr`): logo top-left, links top-right,
 * social mid-right, paragraphs spanning the bottom row. That placement is driven
 * by the three `#w-node-…` ids below — they MUST match the reference exactly or
 * the CDN grid-area rules won't apply.
 *
 * The reveal (sticky pin + rounded-corner cap) is owned by `.zenda-footer-slot`
 * in src/styles/zenda-shell.css. In the reference the `<footer>` itself is the
 * sticky element, but here it sits inside the wrapper that carries the
 * `.zenda-clone` scope class, so the wrapper takes the sticky instead.
 *
 * The link entries below carry a dictionary KEY rather than literal text —
 * which also keeps `scripts/i18n-hardcoded-ratchet.ts` quiet, since it flags
 * `label: "Capitalized"` as an untranslated string.
 *
 * The hrefs point INWARD (2026-08-08). They used to be zenda's own routes —
 * `/for-schools`, `/parents`, `/blogs`, `/contact`, `/about-us`,
 * `/institution-terms-conditions-…`, `/privacy-policy` — every one of which
 * 404s on a school subdomain. Translating a label on a link that cannot
 * resolve is not i18n, so the remap came with the Arabic pass rather than
 * after it. The six destinations are the marketing routes this block actually
 * serves; there is no terms or privacy page at tenant level yet, which is why
 * the third column holds two links instead of the reference's three. The grid
 * is driven by the three `.footer_links-col` wrappers, not the link count, so
 * the layout is unchanged.
 */

const LINK_COLUMNS: { key: string; href: string }[][] = [
  [
    { key: "about", href: "/about" },
    { key: "academic", href: "/academic" },
  ],
  [
    { key: "admissions", href: "/admissions" },
    { key: "apply", href: "/application" },
  ],
  [
    { key: "visit", href: "/tour" },
    { key: "enquire", href: "/inquiry" },
  ],
]

const SOCIAL_LINKS = [
  {
    text: "Instagram",
    href: "https://www.instagram.com/zenda.app/",
    path: "M9.75 5.25C8.85998 5.25 7.98995 5.51392 7.24993 6.00839C6.50991 6.50285 5.93314 7.20566 5.59254 8.02792C5.25195 8.85019 5.16283 9.75499 5.33647 10.6279C5.5101 11.5008 5.93868 12.3026 6.56802 12.932C7.19736 13.5613 7.99918 13.9899 8.87209 14.1635C9.74501 14.3372 10.6498 14.2481 11.4721 13.9075C12.2943 13.5669 12.9971 12.9901 13.4916 12.2501C13.9861 11.51 14.25 10.64 14.25 9.75C14.2488 8.55691 13.7743 7.41303 12.9306 6.56939C12.087 5.72575 10.9431 5.25 9.75 5.25ZM9.75 12.75C9.15666 12.75 8.57664 12.5741 8.08329 12.2444C7.58994 11.9148 7.20542 11.4462 6.97836 10.8981C6.7513 10.3499 6.69189 9.74667 6.80764 9.16473C6.9234 8.58279 7.20912 8.04824 7.62868 7.62868C8.04824 7.20912 8.58279 6.9234 9.16473 6.80764C9.74667 6.69189 10.3499 6.75 10.8981 6.97836C11.4462 7.20542 11.9148 7.58994 12.2444 8.08329C12.5741 8.57664 12.75 9.75 12.75 9.75C12.75 10.5456 12.4339 11.3087 11.8713 11.8713C11.3087 12.4339 10.5456 12.75 9.75 12.75ZM14.25 0H5.25C3.85807 0.00148896 2.52358 0.555091 1.53933 1.53933C0.555091 2.52358 0.00148896 3.85807 0 5.25V14.25C0.00148896 15.6419 0.555091 16.9764 1.53933 17.9607C2.52358 18.9449 3.85807 19.4985 5.25 19.5H14.25C15.6419 19.4985 16.9764 18.9449 17.9607 17.9607C18.9449 16.9764 19.4985 15.6419 19.5 14.25V5.25C19.4985 3.85807 18.9449 2.52358 17.9607 1.53933C16.9764 0.555091 15.6419 0.00148896 14.25 0ZM18 14.25C18 15.2446 17.6049 16.1984 16.9016 16.9016C16.1984 17.6049 15.2446 18 14.25 18H5.25C4.25544 18 3.30161 17.6049 2.59835 16.9016C1.89509 16.1984 1.5 15.2446 1.5 14.25V5.25C1.5 4.25544 1.89509 3.30161 2.59835 2.59835C3.30161 1.89509 4.25544 1.5 5.25 1.5H14.25C15.2446 1.5 16.1984 1.89509 16.9016 2.59835C17.6049 3.30161 18 4.25544 18 5.25V14.25ZM15.75 4.875C15.75 5.0975 15.684 5.31501 15.5604 5.50002C15.4368 5.68502 15.2611 5.82922 15.0555 5.91436C14.85 5.99951 14.6238 6.02179 14.4055 5.97838C14.1873 5.93498 13.9868 5.82783 13.8295 5.6705C13.6722 5.51316 13.565 5.31271 13.5216 5.09448C13.4782 4.87625 13.5005 4.65005 13.5856 4.44448C13.6708 4.23891 13.815 4.06321 14 3.9396C14.185 3.81598 14.4025 3.75 14.625 3.75C14.9234 3.75 15.2095 3.86853 15.4205 4.0795C15.6315 4.29048 15.75 4.57663 15.75 4.875Z",
  },
  {
    text: "LinkedIn",
    href: "https://www.linkedin.com/company/zendaapp/?viewAsMember=true",
    path: "M18.5 0H2C1.60218 0 1.22064 0.158035 0.93934 0.43934C0.658035 0.720644 0.5 1.10218 0.5 1.5V18C0.5 18.3978 0.658035 18.7794 0.93934 19.0607C1.22064 19.342 1.60218 19.5 2 19.5H18.5C18.8978 19.5 19.2794 19.342 19.5607 19.0607C19.842 18.7794 20 18.3978 20 18V1.5C20 1.10218 19.842 0.720644 19.5607 0.43934C19.2794 0.158035 18.8978 0 18.5 0ZM18.5 18H2V1.5H18.5V18ZM7.25 8.25V14.25C7.25 14.4489 7.17098 14.6397 7.03033 14.7803C6.88968 14.921 6.69891 15 6.5 15C6.30109 15 6.11032 14.921 5.96967 14.7803C5.82902 14.6397 5.75 14.4489 5.75 14.25V8.25C5.75 8.05109 5.82902 7.86032 5.96967 7.71967C6.11032 7.57902 6.30109 7.5 6.5 7.5C6.69891 7.5 6.88968 7.57902 7.03033 7.71967C7.17098 7.86032 7.25 8.05109 7.25 8.25ZM15.5 10.875V14.25C15.5 14.4489 15.421 14.6397 15.2803 14.7803C15.1397 14.921 14.9489 15 14.75 15C14.5511 15 14.3603 14.921 14.2197 14.7803C14.079 14.6397 14 14.4489 14 14.25V10.875C14 10.3777 13.8025 9.90081 13.4508 9.54918C13.0992 9.19754 12.6223 9 12.125 9C11.6277 9 11.1508 9.19754 10.7992 9.54918C10.4475 9.90081 10.25 10.3777 10.25 10.875V14.25C10.25 14.4489 10.171 14.6397 10.0303 14.7803C9.88968 14.921 9.69891 15 9.5 15C9.30109 15 9.11032 14.921 8.96967 14.7803C8.82902 14.6397 8.75 14.4489 8.75 14.25V8.25C8.75093 8.06629 8.81925 7.88931 8.94201 7.75264C9.06477 7.61596 9.23342 7.5291 9.41598 7.50852C9.59853 7.48794 9.78229 7.53508 9.93239 7.641C10.0825 7.74691 10.1885 7.90423 10.2303 8.08313C10.7377 7.73894 11.3292 7.53947 11.9414 7.50611C12.5536 7.47276 13.1633 7.60679 13.705 7.89381C14.2468 8.18083 14.7001 8.61 15.0164 9.13523C15.3326 9.66046 15.4998 10.2619 15.5 10.875ZM7.625 5.625C7.625 5.8475 7.55902 6.06501 7.4354 6.25002C7.31179 6.43502 7.13609 6.57922 6.93052 6.66436C6.72495 6.74951 6.49875 6.77179 6.28052 6.72838C6.06229 6.68498 5.86184 6.57783 5.7045 6.4205C5.54717 6.26316 5.44002 6.06271 5.39662 5.84448C5.35321 5.62625 5.37549 5.40005 5.46064 5.19448C5.54578 4.98891 5.68998 4.81321 5.87498 4.6896C6.05999 4.56598 6.2775 4.5 6.5 4.5C6.79837 4.5 7.08452 4.61853 7.2955 4.8295C7.50647 5.04048 7.625 5.32663 7.625 5.625Z",
  },
  {
    text: "Facebook",
    href: "https://www.facebook.com/zendaapp/",
    path: "M9.75 0C7.82164 0 5.93657 0.571828 4.33319 1.64317C2.72982 2.71451 1.48013 4.23726 0.742179 6.01884C0.00422452 7.80042 -0.188858 9.76082 0.187348 11.6521C0.563554 13.5434 1.49215 15.2807 2.85571 16.6443C4.21928 18.0079 5.95656 18.9365 7.84787 19.3127C9.73919 19.6889 11.6996 19.4958 13.4812 18.7578C15.2627 18.0199 16.7855 16.7702 17.8568 15.1668C18.9282 13.5634 19.5 11.6784 19.5 9.75C19.4973 7.16498 18.4692 4.68661 16.6413 2.85872C14.8134 1.03084 12.335 0.00272983 9.75 0ZM10.5 17.9653V12H12.75C12.9489 12 13.1397 11.921 13.2803 11.7803C13.421 11.6397 13.5 11.4489 13.5 11.25C13.5 11.0511 13.421 10.8603 13.2803 10.7197C13.1397 10.579 12.9489 10.5 12.75 10.5H10.5V8.25C10.5 7.85218 10.658 7.47064 10.9393 7.18934C11.2206 6.90804 11.6022 6.75 12 6.75H13.5C13.6989 6.75 13.8897 6.67098 14.0303 6.53033C14.171 6.38968 14.25 6.19891 14.25 6C14.25 5.80109 14.171 5.61032 14.0303 5.46967C13.8897 5.32902 13.6989 5.25 13.5 5.25H12C11.2044 5.25 10.4413 5.56607 9.87868 6.12868C9.31608 6.69129 9 7.45435 9 8.25V10.5H6.75C6.55109 10.5 6.36033 10.579 6.21967 10.7197C6.07902 10.8603 6 11.0511 6 11.25C6 11.4489 6.07902 11.6397 6.21967 11.7803C6.36033 11.921 6.55109 12 6.75 12H9V17.9653C6.88575 17.7723 4.92728 16.7717 3.53198 15.1715C2.13667 13.5714 1.41195 11.4949 1.50855 9.37409C1.60515 7.25324 2.51564 5.25127 4.05064 3.7846C5.58563 2.31793 7.62696 1.49947 9.75 1.49947C11.8731 1.49947 13.9144 2.31793 15.4494 3.7846C16.9844 5.25127 17.8949 7.25324 17.9915 9.37409C18.0881 11.4949 17.3633 13.5714 15.968 15.1715C14.5727 16.7717 12.6143 17.7723 10.5 17.9653Z",
  },
]

interface FooterProps {
  /** School name already resolved for display — the footer's wordmark. */
  displayName: string
  /** Locale prefix for the home link, e.g. "en". */
  locale: string
  /** Translated labels, keyed as in `dictionary.marketing.site.footer`. */
  footerLabels?: Record<string, string>
  /**
   * Translated nav labels (`dictionary.marketing.site.nav`). The first three
   * footer links name the same three destinations as the nav, so they read
   * from the same keys — one translation per route, not two that can drift.
   */
  navLabels?: Record<string, string>
}

export function Footer({
  displayName,
  locale,
  footerLabels,
  navLabels,
}: FooterProps) {
  // Footer-specific first, then the nav's, then the key itself as a last
  // resort — a missing key renders its own name rather than blanking a link.
  const label = (key: string) => footerLabels?.[key] ?? navLabels?.[key] ?? key
  return (
    <footer className="footer_component z-0">
      <div className="padding-global-v2 padding-section-medium">
        <div className="container-large">
          <div className="footer_wrap">
            {/* Wordmark (grid: col 1, row 1). The reference sets zenda's logo
                image here; the school's name stands in, set exactly as the nav
                sets it -- same size, weight and purple (.footer_logo-text in
                zenda-shell.css mirrors .nav_logo-text). */}
            <div className="footer_company-wrap">
              <Link
                href={`/${locale}`}
                aria-label={navLabels?.home ?? "Go to the home page"}
                className="footer_logo-link w-inline-block"
              >
                <span className="footer_logo-text">{displayName}</span>
              </Link>
            </div>

            {/* Link columns (grid: col 2, row 1 — justify-self:end) */}
            <nav
              id="w-node-_411f597c-d67f-df2e-9989-ef5f19a94e14-19a94e0b"
              className="footer_links-grid"
            >
              {LINK_COLUMNS.map((col, i) => (
                <div key={i} className="footer_links-col">
                  {col.map((link) => (
                    <Link
                      key={link.key}
                      href={`/${locale}${link.href}`}
                      className="footer_link w-inline-block"
                    >
                      <div>{label(link.key)}</div>
                    </Link>
                  ))}
                </div>
              ))}
            </nav>

            {/* Social icons (grid: col 2, row 2 — justify-self:end) */}
            <div
              id="w-node-_411f597c-d67f-df2e-9989-ef5f19a94e30-19a94e0b"
              className="footer_social-wrap"
            >
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.text}
                  aria-label={`${footerLabels?.socialAria ?? "Follow us on"} ${social.text}`}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer_social-link w-inline-block"
                >
                  <div className="icon-embed-xsmall w-embed">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="100%"
                      height="100%"
                      viewBox="0 0 20 20"
                      fill="none"
                      preserveAspectRatio="xMidYMid meet"
                      aria-hidden="true"
                      role="img"
                    >
                      <path d={social.path} fill="currentColor" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>

            {/* Description (grid: spans both columns, bottom row) */}
            <div
              id="w-node-_8d0dd67f-957c-7d26-2cbe-9c9b01d47fc5-19a94e0b"
              className="footer_content"
            >
              {/* The school's own two paragraphs, written to the reference's
                  exact word counts (21 and 37) so the grid's bottom row keeps
                  its two- and three-line shape. Deliberately claims nothing
                  tenant-specific -- no grade range, no founding year, no
                  accreditation -- because this footer renders for every
                  school.

                  The school's name is interpolated rather than concatenated:
                  Arabic puts it in the same opening position as English here,
                  but a `{name} …` string lets a future translation move it
                  without touching this file. */}
              <p className="footer_para text-size-small margin-bottom">
                {(footerLabels?.about1 ?? "{name}").replace(
                  "{name}",
                  displayName
                )}
              </p>
              <p className="footer_para text-size-small">
                {footerLabels?.about2 ?? ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
