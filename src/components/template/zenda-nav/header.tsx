// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported from zenda (template/header). Renders under the `.zenda-clone` CSS
// scope (see src/styles/zenda-clone.css), which owns `.nav_component` and
// everything below it.
//
// Two deviations from the source. The four links come from `marketingConfig`
// rather than zenda's own, so this stays in step with the rest of the school
// site. And the search / language / theme / account controls that used to live
// in SiteHeader move in beside them -- zenda has no such cluster, so
// `.nav_utility-wrap` is ours (styled in src/styles/zenda-shell.css).
//
// The `hero-logo` / `hero-link` attributes are load-bearing: <HeroIntro/> on
// the homepage animates them as part of one timeline with the hero itself.

"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { gsap } from "gsap"

import { UserButton } from "@/components/auth/user-button"
import { LangSwitcher } from "@/components/template/marketing-header/lang-switcher"
import { ModeSwitcher } from "@/components/template/marketing-header/mode-switcher"
import { marketingConfig } from "@/components/template/site-header/config"
import { SearchMenu } from "@/components/template/site-header/search-menu"

// The hand-drawn squiggle zenda.com sweeps under a nav link on hover. Stroke uses
// currentColor, which the .link-draw__box class paints purple.
const DRAW_LINE_PATH =
  "M17.0039 33.582C32.2307 33.7406 47.4552 33.7271 62.676 33.7113C67.3044 33.7064 96.546 33.9549 104.728 32.9769C113.615 31.9146 104.516 29.2022 102.022 28.1821C89.9573 23.2459 77.3751 19.9248 65.0451 15.9546C57.8987 13.6536 37.2813 9.3934 44.2314 7.00157C50.9667 4.68363 64.2873 6.71856 70.4249 6.86582C105.866 7.71618 141.306 8.48751 176.75 9.49827C217.874 10.671 258.906 11.9547 300 15.3886"

interface NavDrawLinkProps {
  href: string
  label: string
  isCurrent: boolean
  onClick: () => void
}

// A nav link whose underline is "drawn" on hover by tweening the SVG path's
// stroke-dashoffset (the same draw-on / draw-off micro-interaction as zenda.com).
function NavDrawLink({ href, label, isCurrent, onClick }: NavDrawLinkProps) {
  const pathRef = useRef<SVGPathElement>(null)
  const lenRef = useRef(0)

  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const len = path.getTotalLength()
    lenRef.current = len
    // dash = len, gap = 2*len. At offset `len + 2` the whole path sits inside the gap, so
    // it is fully hidden with no round-cap "dot" at either end (robust to sub-px rounding).
    gsap.set(path, {
      strokeDasharray: `${len} ${len * 2}`,
      strokeDashoffset: len + 2,
    })
  }, [])

  const drawIn = () => {
    const path = pathRef.current
    if (!path) return
    gsap.killTweensOf(path)
    gsap.to(path, { strokeDashoffset: 0, duration: 0.4, ease: "power2.out" })
  }

  const drawOut = () => {
    const path = pathRef.current
    if (!path) return
    gsap.killTweensOf(path)
    gsap.to(path, {
      strokeDashoffset: lenRef.current + 2,
      duration: 0.4,
      ease: "power2.out",
    })
  }

  return (
    <Link
      nav-link=""
      hero-link=""
      data-draw-line=""
      href={href}
      onClick={onClick}
      onMouseEnter={drawIn}
      onMouseLeave={drawOut}
      className={`nav_link w-inline-block ${isCurrent ? "w--current" : ""}`}
      aria-current={isCurrent ? "page" : undefined}
    >
      <div>{label}</div>
      <div data-draw-line-box="" className="link-draw__box">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          viewBox="0 0 310 41"
          fill="none"
          preserveAspectRatio="none"
          className="text-draw__box-svg"
        >
          <path
            ref={pathRef}
            d={DRAW_LINE_PATH}
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </Link>
  )
}

interface ZendaNavProps {
  /** Locale prefix for every link, e.g. "en". */
  locale: string
  /** School name already resolved for display -- alt text on the logo. */
  displayName: string
  /** Tenant subdomain, for the account menu's links back into the dashboard. */
  subdomain: string
  logoUrl?: string | null
  /** Translated nav labels, keyed as in `dictionary.marketing.site.nav`. */
  navLabels?: Record<string, string>
}

export function ZendaNav({
  locale,
  displayName,
  subdomain,
  logoUrl,
  navLabels,
}: ZendaNavProps) {
  const [isActive, setIsActive] = useState(false)
  const pathname = usePathname() || ""

  const navLinks = marketingConfig.mainNav.map((item) => ({
    // `path` is the unprefixed route the active check compares against; `href`
    // is what the browser follows.
    path: item.href,
    href: `/${locale}${item.href}`,
    label: (item.key && navLabels?.[item.key]) || item.title,
  }))

  const navRef = useRef<HTMLElement>(null)
  const isActiveRef = useRef(isActive)

  const isActiveLink = (href: string) => {
    // Normalize path by stripping the locale prefix (e.g. /en/for-schools -> /for-schools)
    const normalizedPath = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/")
    return normalizedPath === href || (normalizedPath === "/" && href === "/")
  }

  // Close the mobile menu on Escape and whenever the route changes.
  useEffect(() => {
    if (!isActive) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsActive(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [isActive])

  // Close the mobile menu whenever the route changes. The reference did this in
  // an effect; React 19's lint rule rejects a synchronous setState there, so
  // this is the documented adjust-state-during-render form instead — same
  // outcome, one fewer render pass.
  const [lastPathname, setLastPathname] = useState(pathname)
  if (lastPathname !== pathname) {
    setLastPathname(pathname)
    setIsActive(false)
  }

  // Let the scroll handler (bound once) read the latest menu state.
  useEffect(() => {
    isActiveRef.current = isActive
  }, [isActive])

  // Sticky nav that "stays a bit, then gets knocked out of the way": after a 100px
  // grace it slides up out of view while scrolling down, and drops back in when
  // scrolling up — the same GSAP hide/show (y:-100% / y:0%, 0.4s power2.out) that
  // zenda.com uses. Skipped while the mobile menu is open so the menu can't shift.
  //
  // Plus the "tuck", which /academic asks for and no other page does: the page
  // loads already scrolled down by one nav height, so that hero opens flush
  // against the top edge with the nav parked just above the fold. It stays
  // parked until the first upward scroll brings it back, then the normal
  // hide/show above resumes. The hero's splash covers the jump.
  //
  // Opt-in, and it has to stay that way — a listener whose whole job is to
  // scroll the page down is a landmine on any page that did not ask. Two
  // triggers, because neither alone covers both entries: `[data-zenda-tuck]` in
  // the DOM at mount handles a fresh load (the marker is server-rendered, so it
  // is already there), and the `zenda:hero-mounted` event handles a client-side
  // navigation, where this nav does not remount. The homepage marks neither and
  // still opens at the very top with its logo centred.
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    let lastScrollTop = 0
    let ticking = false
    let tucked = false
    gsap.set(nav, { y: 0 })

    const tuck = () => {
      const h = nav.offsetHeight || 80
      tucked = true
      gsap.set(nav, { y: "-101%" }) // fully off — avoids a sub-pixel sliver
      window.scrollTo(0, h)
      lastScrollTop = h
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop
        if (tucked) {
          // Parked above the fold: hold until the user scrolls up, then reveal
          // once and hand back to the normal behaviour.
          if (scrollTop < lastScrollTop) {
            tucked = false
            gsap.to(nav, {
              y: "0%",
              duration: 0.4,
              ease: "power2.out",
              overwrite: true,
            })
          } else {
            gsap.set(nav, { y: "-101%" })
          }
        } else {
          const hide =
            !isActiveRef.current && scrollTop > lastScrollTop && scrollTop > 100
          gsap.to(nav, {
            y: hide ? "-100%" : "0%",
            duration: 0.4,
            ease: "power2.out",
            overwrite: true,
          })
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop
        ticking = false
      })
    }

    if (document.querySelector("[data-zenda-tuck]")) tuck()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("zenda:hero-mounted", tuck)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("zenda:hero-mounted", tuck)
      gsap.killTweensOf(nav)
    }
  }, [])

  return (
    <nav ref={navRef} id="mainNav" nav-component="" className="nav_component">
      <div className="nav_wrap">
        <Link
          hero-logo=""
          aria-label={navLabels?.home ?? "Go to the home page"}
          href={`/${locale}`}
          className={`nav_logo-link w-nav-brand ${isActiveLink("/") ? "w--current" : ""}`}
        >
          {/* The crest came back. Zenda's own lockup is a bare wordmark, so the
              mark only appears for a school that has actually uploaded one --
              a school without a logo still gets the original name-alone
              treatment rather than a placeholder. `.nav_logo-link img` in
              zenda-shell.css has carried the sizing since the mark was first
              removed. */}
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={displayName}
              width={32}
              height={32}
              className="img-auto"
              priority
            />
          ) : null}
          <span className="nav_logo-text">{displayName}</span>
        </Link>

        {/* Links, then the hamburger, all pushed to the end of the bar. Also
            the positioning context the utility panel drops out of. */}
        <div className="nav_right">
          <div
            id="nav-menu"
            nav-menu-layer-1=""
            className={`nav_menu-wrap ${isActive ? "is-active" : ""}`}
            style={{ display: isActive ? "block" : undefined }}
          >
            <div nav-menu-layer-3="" className="nav_menu_layer_1">
              <div className="nav_menu">
                {navLinks.map(({ path, href, label }) => (
                  <NavDrawLink
                    key={href}
                    href={href}
                    label={label}
                    isCurrent={isActiveLink(path)}
                    onClick={() => setIsActive(false)}
                  />
                ))}
              </div>
            </div>
            <div nav-menu-layer-2="" className="nav_menu_layer_2"></div>
          </div>

          {/* Search, language, theme and account -- not part of the zenda clone,
              these came over from SiteHeader. They live in a panel the hamburger
              opens rather than sitting in the bar, so the bar keeps zenda's
              logo-and-links proportions at every width. */}
          <div className={`nav_utility-wrap ${isActive ? "is-active" : ""}`}>
            <SearchMenu />
            <LangSwitcher />
            <ModeSwitcher />
            <UserButton variant="site" subdomain={subdomain} />
          </div>

          {/* `hero-link` puts the hamburger into the homepage intro's staggered
              nav fade-in. Without it the bar is empty during the centred splash
              except for one stray hamburger, which the reference has nothing
              standing in for. */}
          <button
            type="button"
            hero-link=""
            fs-scrolldisable-element="toggle"
            nav-menu-btn=""
            className={`nav_menu-btn ${isActive ? "is-active" : ""}`}
            onClick={() => setIsActive((prev) => !prev)}
            aria-label={
              isActive
                ? (navLabels?.closeMenu ?? "Close menu")
                : (navLabels?.openMenu ?? "Open menu")
            }
            aria-expanded={isActive}
            aria-controls="nav-menu"
          >
            <div className="nav_hamburger_component">
              <div
                className={`nav_hamburger_wrap ${isActive ? "is-active" : ""}`}
              >
                <div className="nav_hamburger_line"></div>
                <div className="nav_hamburger_embed w-embed">
                  {/* The reference only ran the bars-to-X transition below
                      991px, where its hamburger was the only nav. Ours is on at
                      every width, so the media query comes off. */}
                  <style>{`
                    .nav_hamburger_wrap {
                      /* Narrower bars with a wider gap than the reference's --
                         a school crest + name already sits at the other end of
                         the bar, so a lighter mark reads less heavy beside it.
                         --width is a share of the 2rem button box. */
                      --thickness: 0.18rem;
                      --gap: 0.42rem;
                      --rotate: 45;
                      --width: 68%;
                    }
                    .is-active .nav_hamburger_line:first-child {
                      transform: translateY(calc(var(--thickness) * 0.5 + var(--gap) * 0.5)) rotate(calc(var(--rotate) * 3 * -1deg));
                    }
                    .is-active .nav_hamburger_line:last-child {
                      transform: translateY(calc(var(--thickness) * -0.5  + var(--gap) * -0.5)) rotate(calc(var(--rotate) * 3 * 1deg));
                    }
                    .nav_hamburger_line {
                      transition-property: transform;
                      transition-duration: 460ms;
                      transition-timing-function: cubic-bezier(.164, .84, .44, 1);
                    }
                  `}</style>
                </div>
                <div className="nav_hamburger_line"></div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </nav>
  )
}
