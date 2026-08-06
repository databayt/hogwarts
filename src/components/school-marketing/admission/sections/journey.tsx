// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Image from "next/image"

import { AnthropicIcons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../shared/section-container"
import { JourneySwitch } from "./journey-switch"

interface AdmissionJourneyProps {
  lang: Locale
  dictionary?: Dictionary
}

/*
 * "How it works" + "What you need", merged, on zenda's /parents `p-services`
 * pattern ("Switch to smarter school payments"): a two-column scroll switcher
 * where the start column of steps scrolls past a sticky end column, and only
 * the step crossing the viewport centre -- with its paired panel -- is shown.
 *
 * The merge is the point. These were two stacked sections asking the reader to
 * hold four steps in their head and then match them against three document
 * groups listed separately. Pairing each step with the documents IT needs
 * answers "what do I do next" and "what do I bring" in the same glance.
 *
 * Geometry lives in `.adm-jrn_*` (school-marketing.css), transcribed from
 * `.p-services_*` onto logical properties -- not the `.zenda-clone` markup,
 * which is English/LTR-only while this page is bilingual.
 *
 * THE PANEL CARRIES BOTH the step's checklist and zenda's own artwork, which
 * is one line of divergence from the reference and one deliberate substitution.
 * zenda's sticky column is a product screenshot per service, nothing else; ours
 * stacks the checklist above the art, because the checklist is the half of the
 * merge that carries information and it has to be the thing that switches.
 *
 * THE ART IS FROM `zenda/public/images/how-it-works/`, NOT `images/parents/`,
 * and the distinction is the whole reason art was possible here. The /parents
 * screenshots this section actually uses are zenda's PRODUCT UI -- `pay-now`
 * is a phone showing "Total Payable USD 200 / PAY NOW / Registration Fees".
 * Shipping that on a tenant's admissions page would put a competitor's app on
 * a school's own site AND contradict this block's standing promise that
 * applying is free (see the wizard note above; "pay" is kept out of the
 * homepage verb list for the same reason). The `how-it-works` set is generic
 * school objects in zenda's house style -- purple `#c4a8f5` over near-black
 * linework, transparent ground, no branding, no UI, no figures -- so it
 * carries the surface language without carrying zenda.
 *
 * The document-to-step mapping is not invented either: every string below
 * already shipped on this page under "Admission Requirements". Only the
 * grouping is new, and it follows the order a school actually asks for them --
 * forms to apply, records to be assessed, personal papers to enrol. The tour
 * needs nothing, which is worth saying out loud rather than leaving a blank.
 */
export function AdmissionJourney({ lang, dictionary }: AdmissionJourneyProps) {
  const dict =
    (
      dictionary as unknown as {
        school?: {
          admission?: { sections?: { journey?: Record<string, string> } }
        }
      }
    )?.school?.admission?.sections?.journey ?? {}

  const steps = [
    {
      icon: AnthropicIcons.Book,
      title: dict.submitApplication || "Submit Application",
      description:
        dict.submitApplicationDesc ||
        "Complete our online application form with all required documents",
      needTitle: dict.applicationForms || "Application Forms",
      needs: [
        dict.completedForm || "Completed application form",
        dict.parentQuestionnaire || "Parent questionnaire",
        // Applying is always free -- never list a fee here.
        dict.recentPhotograph || "Recent photograph",
      ],
      tint: "#e3d3ff",
      art: "/images/how-it-works/exams.webp",
      artW: 684,
      artH: 700,
      pill: "#835bb7",
      pillInk: "#ffffff",
    },
    {
      icon: AnthropicIcons.Checklist,
      title: dict.campusTour || "Campus Tour",
      description:
        dict.campusTourDesc ||
        "Experience our amazing facilities with a guided tour",
      needTitle: dict.nothingToBring || "Nothing to bring",
      needs: [dict.nothingToBringItem || "Just book a time that suits you"],
      tint: "#ccd5fd",
      art: "/images/how-it-works/trips.webp",
      artW: 552,
      artH: 700,
      pill: "#7187c7",
      pillInk: "#ffffff",
    },
    {
      icon: AnthropicIcons.Archive,
      title: dict.meetGreet || "Meet & Greet",
      description:
        dict.meetGreetDesc ||
        "Connect with our admissions team and faculty members",
      needTitle: dict.academicRecords || "Academic Records",
      needs: [
        dict.officialTranscripts || "Official transcripts",
        dict.testScores || "Test scores (if applicable)",
        dict.teacherRecommendations || "Teacher recommendations",
      ],
      tint: "#fcd0e5",
      art: "/images/how-it-works/counselling.webp",
      artW: 700,
      artH: 699,
      pill: "#c9e584",
      pillInk: "#383940",
    },
    {
      icon: AnthropicIcons.Sparkle,
      title: dict.joinFamily || "Join Family",
      description:
        dict.joinFamilyDesc ||
        "Complete enrollment and begin your educational journey with us",
      needTitle: dict.personalInfo || "Personal Information",
      needs: [
        dict.birthCertificate || "Birth certificate",
        dict.immunizationRecords || "Immunization records",
        dict.emergencyContacts || "Emergency contacts",
      ],
      tint: "#d9d5ca",
      art: "/images/how-it-works/uniform.webp",
      artW: 700,
      artH: 694,
      pill: "#383940",
      pillInk: "#ffffff",
    },
  ]

  // `toLocaleString("ar")` yields LATIN digits; the Arabic-Indic set needs the
  // numbering system spelled out.
  const numerals = new Intl.NumberFormat(
    lang === "ar" ? "ar-u-nu-arab" : "en-US"
  )
  const stepWord = dict.step || "Step"

  const copy = (step: (typeof steps)[number], index: number) => (
    <div className="adm-jrn_content">
      {/* zenda tints the pill per item and pairs it with that item's card;
       * both palettes are its own, pinned as literal hex for the reason the
       * rest of this page pins them -- the zenda chrome never flips dark, so a
       * theme token would invert against it. */}
      <span
        className="adm-jrn_tag"
        style={{ backgroundColor: step.pill, color: step.pillInk }}
      >
        <step.icon className="h-5 w-5" aria-hidden />
        {stepWord} {numerals.format(index + 1)}
      </span>
      <div>
        <h3 className="zenda-heading is-section mb-3">{step.title}</h3>
        <p className="zenda-body adm-jrn_para">{step.description}</p>
      </div>
    </div>
  )

  return (
    <SectionContainer>
      {/* zenda's `.p-services_header` -- centred, capped at 35rem. */}
      <div className="mx-auto mb-8 flex max-w-[35rem] flex-col gap-2 text-center md:mb-16">
        <p className="eyebrow band-muted">{dict.eyebrow || "How it works"}</p>
        <h2 className="zenda-heading">
          {dict.title || "Four steps is all you need"}
        </h2>
      </div>

      <div id="admission-journey" className="adm-jrn_grid">
        {/* The scrolling column (>=768px only). */}
        <div className="adm-jrn_list-wrap">
          <div className="adm-jrn_list">
            {steps.map((step, index) => (
              <div key={index} data-jrn-step={index} className="adm-jrn_item">
                {copy(step, index)}
              </div>
            ))}
          </div>
        </div>

        {/* The sticky column. Every panel shares one grid cell above the
         * breakpoint and cross-fades in place; below it they stack, each
         * followed by its own copy. */}
        <div className="adm-jrn_track">
          <div className="adm-jrn_sticky">
            <div className="adm-jrn_panels">
              {steps.map((step, index) => (
                <div
                  key={index}
                  data-jrn-panel={index}
                  /* Index 0 ships active, so the column is never blank -- with
                   * no JS the reader still sees a complete first step. */
                  className={`adm-jrn_panel-slot ${index === 0 ? "is-active" : ""}`.trim()}
                >
                  <div
                    className="adm-jrn_panel"
                    style={{ backgroundColor: step.tint }}
                  >
                    <div className="adm-jrn_panel-body">
                      <div>
                        <p className="adm-jrn_panel-label mb-4">
                          {dict.whatYouNeed || "What you need"}
                        </p>
                        <h3 className="font-heading adm-jrn_panel-title mb-5">
                          {step.needTitle}
                        </h3>
                        <ul className="adm-jrn_needs space-y-4">
                          {step.needs.map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <Check />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {/* Anchored to the foot of the card, as zenda anchors its
                       * screenshot (`.p-services_img{align-items:flex-end}`).
                       * Decorative -- the checklist above already says it, so
                       * the alt is empty rather than a restatement. */}
                      {/* `unoptimized` is load-bearing, not laziness. These are
                       * already webp at ~45KB and are never drawn above ~330px,
                       * so the optimizer has nothing to win -- and its AVIF
                       * re-encode FLATTENED THE ALPHA on two of the four, which
                       * paints an opaque white box on the tinted card. Serving
                       * the file as authored is the only way the transparency
                       * is guaranteed to be the transparency that renders. */}
                      <div className="adm-jrn_panel-art">
                        <Image
                          src={step.art}
                          alt=""
                          width={step.artW}
                          height={step.artH}
                          unoptimized
                        />
                      </div>
                    </div>
                  </div>
                  <div className="adm-jrn_mobile-copy mt-6">
                    {copy(step, index)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <JourneySwitch rootId="admission-journey" />
    </SectionContainer>
  )
}

/* zenda's own checkmark -- the filled dark-purple disc from `parents/services`,
 * which is the mark this surface uses for "included". */
function Check() {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className="adm-jrn_check"
      aria-hidden="true"
    >
      <circle cx="19.767" cy="19.764" r="19.72" fill="#614D76" />
      <path
        d="M11.738 20.2l5.06 5.059L27.79 14.267"
        stroke="#fff"
        strokeWidth="3.5"
      />
    </svg>
  )
}
