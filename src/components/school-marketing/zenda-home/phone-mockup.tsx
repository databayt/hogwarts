// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (home/phone-mockup). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

/* eslint-disable @next/next/no-img-element */
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { FeaturesScroll } from "./features-scroll"

// Reference assets live on the Webflow CDN (same project bucket the site loads
// its CSS from); the section_features classes below are styled by that CSS.
const CDN = "https://cdn.prod.website-files.com/622da43f87e21836ee21bed6/"
const IMG = {
  basketball: CDN + "67e4005658da1580c0a05cb6_basketball-icon.webp",
  transport: CDN + "68256caf012087afc36967c5_transport-icon.webp",
  uniform: CDN + "6867975634e62752187c1916_Uniform.webp",
  cloth: CDN + "68679756ac63d771a9c9c186_Activities.webp",
  compass: CDN + "67e3ab4ec6ab1da31980e0ef_Group%201244838975.webp",
  bread: CDN + "67e3a999c1b2d9424f817b51_bread-icon.webp",
  juice: CDN + "68256ee0ce17a63e6c85098e_juice-package-icon.webp",
  textbooks: CDN + "68256df22f1d9b02f705f8f7_textbooks-icon.webp",
  fee: CDN + "685536efb5f2bb7969e910b0_fee.svg",
  clock: CDN + "68256df282ac8a8bb802d887_clock-icon.webp",
  paintbrush: CDN + "680892bc1cb4c601a004d9d4_activities.png",
  events: CDN + "68679756f98f24df717873bf_Events.webp",
  supplies: CDN + "68256df2f5d14c323e8d488e_supplies-icon.webp",
  mobile: CDN + "67e4084339958da4f71877b4_mobile-mockup.webp",
  bag: CDN + "685d45179dbf65da8996ec74_bag.webp",
  cup: CDN + "67e431889b4aa073c0a33447_cup-icon.webp",
} as const

type Item = {
  attr?: string // GSAP target, e.g. "feature-left-1"
  item: string // .features_item modifier(s)
  wrap?: string // .features_img-wrap modifier
  img?: keyof typeof IMG
  title?: string
}

// The grid: each row is a flex line of pills; left/right items fly in from the
// matching side as you scroll. Items without a `attr` are static filler pills.
// Titles resolve from the dictionary (reusing the existing marketing.phoneMockup.items.*
// keys that already feed the older, non-clone phone-mockup.tsx) so this
// function is called from the component body once `dictionary` is in scope.
function buildRows(dictionary?: Dictionary): { row: string; items: Item[] }[] {
  const t = dictionary?.marketing?.phoneMockup?.items
  const activities = t?.activities ?? "Activities"
  const transport = t?.transport ?? "Transport"
  const uniform = t?.uniform ?? "Uniform"
  const security = t?.security ?? "Security"
  const notebooks = t?.notebooks ?? "Notebooks"
  const fees = t?.fees ?? "Fees"
  const supplies = t?.supplies ?? "Supplies"
  const laboratoryEquipment = t?.laboratoryEquipment ?? "Laboratory equipment"
  const events = t?.events ?? "Events"
  const tripsAndTours = t?.tripsAndTours ?? "Trips & Tours"

  return [
    {
      row: "is-space-between",
      items: [
        {
          attr: "feature-left-1",
          item: "is-1",
          wrap: "is-activities",
          img: "basketball",
          title: activities,
        },
        {
          attr: "feature-right-1",
          item: "is-transport is-2",
          wrap: "is-transport",
          img: "transport",
          title: transport,
        },
      ],
    },
    {
      row: "",
      items: [
        {
          attr: "feature-left-2",
          item: "is-padding-left",
          wrap: "is-uniform",
          img: "uniform",
          title: uniform,
        },
        {
          attr: "feature-left-3",
          item: "is-img-only",
          wrap: "is-cloth",
          img: "cloth",
        },
        {
          item: "is-padding-left",
          wrap: "is-compass",
          img: "compass",
          title: supplies,
        },
        {
          attr: "feature-right-3",
          item: "is-img-only",
          wrap: "is-bread",
          img: "bread",
        },
        {
          attr: "feature-right-2",
          item: "is-transparent-center",
          title: security,
        },
      ],
    },
    {
      row: "",
      items: [
        {
          attr: "feature-left-4",
          item: "is-img-only",
          wrap: "is-juice-package",
          img: "juice",
        },
        {
          attr: "feature-left-5",
          item: "is-transparent",
          img: "textbooks",
          title: notebooks,
        },
        {
          item: "is-padding-left",
          wrap: "is-compass",
          img: "compass",
          title: supplies,
        },
        {
          attr: "feature-right-4",
          item: "is-fees",
          wrap: "is-fees",
          img: "fee",
          title: fees,
        },
        {
          attr: "feature-right-5",
          item: "is-img-only",
          wrap: "is-clock",
          img: "clock",
        },
        {
          attr: "feature-right-6",
          item: "is-padding-left",
          wrap: "is-compass",
          img: "compass",
          title: supplies,
        },
      ],
    },
    {
      row: "is-right-align",
      items: [
        {
          attr: "feature-left-6",
          item: "is-padding-left",
          wrap: "is-compass",
          img: "compass",
          title: laboratoryEquipment,
        },
        {
          attr: "feature-left-7",
          item: "is-img-only",
          wrap: "is-paint-brush",
          img: "paintbrush",
        },
        {
          attr: "feature-left-8",
          item: "is-padding-left",
          wrap: "is-compass",
          img: "compass",
          title: supplies,
        },
        {
          attr: "feature-right-7",
          item: "is-padding-left",
          wrap: "is-compass",
          img: "events",
          title: events,
        },
        {
          attr: "feature-right-8",
          item: "is-supplies",
          img: "supplies",
          title: tripsAndTours,
        },
      ],
    },
  ]
}

type Block = {
  attr: string
  block: string
  title?: string
  icon?: keyof typeof IMG
  iconClass?: string
}

// "Rewards" has no existing marketing.phoneMockup match (see note in the map
// JSON re: the loyalty concept dropped from rewards.tsx) so it's minted fresh
// under marketing.site.home.phoneMockup.items.rewards; the rest reuse the
// same marketing.phoneMockup.items.* keys as buildRows() above.
function buildMockupBlocks(dictionary?: Dictionary): Block[] {
  const uniform =
    dictionary?.marketing?.phoneMockup?.items?.uniform ?? "Uniform"
  const supplies =
    dictionary?.marketing?.phoneMockup?.items?.supplies ?? "Supplies"
  const rewards =
    dictionary?.marketing?.site?.home?.phoneMockup?.items?.rewards ?? "Rewards"

  return [
    { attr: "mockup-item-right-1", block: "is-1" },
    { attr: "mockup-item-right-2", block: "is-2" },
    { attr: "mockup-item-left-1", block: "is-3", title: uniform },
    {
      attr: "mockup-item-right-3",
      block: "is-4",
      title: supplies,
      icon: "bag",
    },
    {
      attr: "mockup-item-right-4",
      block: "is-5",
      title: rewards,
      icon: "cup",
      iconClass: "is-cup",
    },
    { attr: "mockup-item-left-2", block: "is-6" },
    { attr: "mockup-item-left-3", block: "is-7" },
  ]
}

// Render the literal attribute the GSAP timeline selects on (e.g. feature-left-1).
// React passes unknown attributes straight through to the DOM.
const target = (name?: string): Record<string, string> =>
  name ? { [name]: "" } : {}

export function PhoneMockup({ dictionary }: { dictionary?: Dictionary }) {
  const heading =
    dictionary?.marketing?.site?.home?.phoneMockup?.heading ??
    "You juggle life—we handle school"
  const subheading =
    dictionary?.marketing?.phoneMockup?.subheading ??
    "Discover, apply, enroll, track lessons, grades and attendance in one place"
  const rows = buildRows(dictionary)
  const mockupBlocks = buildMockupBlocks(dictionary)

  return (
    <section className="section_features">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-large">
          <div feature-wrap="" className="features_wrap">
            <div className="features_header">
              <h2
                feature-element=""
                className="features_heading heading-style-h2"
              >
                {heading}
              </h2>
              <div feature-element="" className="max-width is-32rem">
                {/* The school's copy at the reference's exact word counts (6
                    and 11) so the header keeps its line breaks. "pay" is
                    deliberately out of the verb list: applying is always free
                    here, and fees only arrive after an offer is accepted.
                    Now sourced from marketing.site.home.phoneMockup.heading
                    and marketing.phoneMockup.subheading (the latter reused
                    verbatim from the older, currently-unrendered
                    school-marketing/phone-mockup.tsx — keep them in sync). */}
                <p className="heading-style-h4">{subheading}</p>
              </div>
            </div>

            <div className="features_grid">
              {rows.map((r, ri) => (
                <div key={ri} className={`features_row ${r.row}`.trim()}>
                  {r.items.map((it, ii) => (
                    <div
                      key={ii}
                      {...target(it.attr)}
                      className={`features_item ${it.item}`.trim()}
                    >
                      {it.img && (
                        <div
                          className={`features_img-wrap ${it.wrap ?? ""}`.trim()}
                        >
                          <img
                            src={IMG[it.img]}
                            loading="lazy"
                            alt=""
                            className="img-auto"
                          />
                        </div>
                      )}
                      {it.title && (
                        <div className="features_title">{it.title}</div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div feature-mockup="" className="features_mobile_component">
              <div className="features_mobile_mockup">
                <img
                  src={IMG.mobile}
                  loading="lazy"
                  width={384}
                  height={780}
                  alt=""
                  className="img-auto"
                />
              </div>
              <div className="features_mobile_bg-wrap">
                {mockupBlocks.map((b, bi) => (
                  <div
                    key={bi}
                    {...target(b.attr)}
                    className={`features_mobile_block ${b.block}`.trim()}
                  >
                    {b.title && (
                      <div className="features_mobile_title">{b.title}</div>
                    )}
                    {b.icon && (
                      <div
                        className={`features_mobile_icon ${b.iconClass ?? ""}`.trim()}
                      >
                        <img
                          src={IMG[b.icon]}
                          loading="lazy"
                          alt=""
                          className="img-auto"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <FeaturesScroll />
          </div>
        </div>
      </div>
    </section>
  )
}
