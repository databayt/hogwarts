// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../../admission/shared/section-container"
import { StageAccordion } from "./stage-accordion"

interface AcademicCurriculumProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AcademicCurriculum({ dictionary }: AcademicCurriculumProps) {
  const curriculum = dictionary?.marketing?.site?.academic?.curriculum

  /*
   * Four stages, and four is the reference's own number -- zenda's values
   * accordion has exactly four cards, so the collapsed rail (3 x 8rem + gaps)
   * and the open card were sized against it. The set used to be three, with
   * "Early Years (K-5)" collapsing kindergarten and elementary into one card;
   * they are different rooms with different teaching, and a parent looking for
   * one of them should not have to read about the other.
   *
   * Icons are zenda's own filled glyphs, the same four the values accordion
   * uses -- solid abstract marks rather than the outline pictograms this
   * carried before, which read as a different design language sitting under a
   * DM Sans heading. They are reused from `/images/about/values/` rather than
   * copied: it is one set of four in one place, and duplicating the bytes just
   * to rename them would leave two copies to keep in step. The corollary is
   * that re-arting /about's values re-arts this section too.
   */
  const levels = [
    {
      title: curriculum?.kindergarten?.title || "Kindergarten (Ages 3-5)",
      description:
        curriculum?.kindergarten?.description ||
        "The first classroom. Children learn through play, build the language and number sense the rest of school rests on, and get used to being part of a group.",
      features: [
        curriculum?.kindergarten?.features?.play || "Play-Based Learning",
        curriculum?.kindergarten?.features?.language || "Early Language",
        curriculum?.kindergarten?.features?.numbers || "Numbers & Shapes",
        curriculum?.kindergarten?.features?.motor || "Motor Skills",
        curriculum?.kindergarten?.features?.social || "Social Skills",
      ],
      icon: "impact",
    },
    {
      title: curriculum?.elementary?.title || "Elementary (Grades 1-5)",
      description:
        curriculum?.elementary?.description ||
        "Foundation building with hands-on learning, literacy development, and social skills through structured, curiosity-led lessons.",
      features: [
        curriculum?.elementary?.features?.phonics || "Phonics & Reading",
        curriculum?.elementary?.features?.math || "Math Foundations",
        curriculum?.elementary?.features?.science || "Science Exploration",
        curriculum?.elementary?.features?.social || "Social Studies",
        curriculum?.elementary?.features?.arts || "Arts & Music",
      ],
      icon: "trust",
    },
    {
      title: curriculum?.middleSchool?.title || "Middle School (Grades 6-8)",
      description:
        curriculum?.middleSchool?.description ||
        "Transitional years focusing on critical thinking, independent learning, and preparation for advanced studies.",
      features: [
        curriculum?.middleSchool?.features?.math || "Advanced Mathematics",
        curriculum?.middleSchool?.features?.literature || "Literature Analysis",
        curriculum?.middleSchool?.features?.science || "Scientific Method",
        curriculum?.middleSchool?.features?.history || "World History",
        curriculum?.middleSchool?.features?.technology || "Technology Skills",
      ],
      icon: "together",
    },
    {
      title: curriculum?.highSchool?.title || "High School (Grades 9-12)",
      description:
        curriculum?.highSchool?.description ||
        "College preparatory curriculum with specialized tracks, AP courses, and career exploration opportunities.",
      features: [
        curriculum?.highSchool?.features?.prep || "College Prep Courses",
        curriculum?.highSchool?.features?.honors || "AP & Honors Classes",
        curriculum?.highSchool?.features?.career || "Career Pathways",
        curriculum?.highSchool?.features?.research || "Research Projects",
        curriculum?.highSchool?.features?.leadership ||
          "Leadership Development",
      ],
      icon: "charge",
    },
  ]

  /*
   * The stages are an expanding accordion rather than the three-card grid this
   * used to be -- zenda's "Our Values" pattern (about-us), rebuilt against the
   * unscoped `.stage-*` classes in school-marketing.css so it stays bilingual.
   * One stage is open at full width; the others collapse to a rail showing a
   * number and a vertical label. It suits a curriculum better than a grid does:
   * the stages are a sequence a reader moves through, not three peers to
   * compare, and only one needs to be legible at a time.
   *
   * Why ported and not reused from zenda-about/values.tsx: that component is
   * `.zenda-clone`-scoped, which is English/LTR-only, and its rem-based sizing
   * is driven by ZendaRootScale -- a document-root font size that cannot be
   * class-scoped, so dropping it onto this page would rescale every native
   * section around it. Details in the CSS comment.
   *
   * Below 768px the cards stack and all four open; <StageAccordion/> bails at
   * the same width. The two breakpoints must not drift apart.
   */
  return (
    <SectionContainer id="curriculum">
      <div className="mb-16 text-center">
        <p className="eyebrow band-muted mb-3">
          {curriculum?.eyebrow || "Curriculum Structure"}
        </p>
        <h2 className="zenda-heading is-section mb-4">
          {curriculum?.title || "Curriculum Overview"}
        </h2>
        <p className="band-muted mx-auto max-w-2xl text-lg">
          {curriculum?.subtitle ||
            "Our progressive curriculum is designed to build knowledge systematically while fostering critical thinking and creativity at every stage."}
        </p>
      </div>

      <div className="stage-accordion">
        {levels.map((level, index) => (
          <div
            key={level.title}
            data-stage-card=""
            role="button"
            tabIndex={0}
            aria-expanded={index === 0}
            // The space before the interpolation, not inside it:
            // prettier-plugin-tailwindcss strips a leading space within the
            // conditional and silently merges the class into `stage-cardis-active`.
            className={`stage-card ${index === 0 ? "is-active" : ""}`.trim()}
          >
            <div data-stage-content="" className="stage-card_content">
              {/* Eagerly loaded on purpose. Three of the four cards are
               * `display: none` until opened, and a lazy image inside a
               * display:none subtree is never fetched -- the glyph would pop in
               * on the first hover of each card. Four icons, 43KB the set.
               * eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/about/values/${level.icon}.webp`}
                alt=""
                className="stage-card_icon"
              />
              <h3 className="stage-card_heading">{level.title}</h3>
              <p>{level.description}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {level.features.map((feature) => (
                  <li
                    key={feature}
                    className="rounded-full bg-white/70 px-3 py-1 text-sm text-neutral-900"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="stage-card_rail">
              <div className="stage-card_number">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div data-stage-label="" className="stage-card_label">
                {level.title}
              </div>
            </div>
          </div>
        ))}
      </div>

      <StageAccordion />
    </SectionContainer>
  )
}
