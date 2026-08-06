// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported from zenda (about/makers) — UI and motion verbatim, copy rewritten for
// the school tenant. Renders under the `.zenda-clone` CSS scope (see
// src/styles/zenda-clone.css).

/**
 * About "OUR PEOPLE" — a grey eyebrow + heading, then a two-up grid of white
 * cards. Each card has a square portrait area (a cut-out photo bottom-aligned
 * over a light-purple arch) above the copy: a title + link, a grey all-caps
 * label, and a short paragraph. Static — no scroll animation.
 *
 * Deliberately OFFICES, NOT NAMED PEOPLE. This page renders for every tenant,
 * so a named principal with a bio would be an invented person on somebody's
 * real school site — the same rule that de-Pottered the homepage (see the block
 * CLAUDE.md). Cards describe the leadership office and the faculty as groups,
 * which is true for any school that publishes this page.
 *
 * PLACEHOLDER PORTRAITS: `raman.webp` / `haseeb.webp` are still the reference
 * site's own founder photographs — real, identifiable people who have nothing
 * to do with this school. They stand in only so the layout can be reviewed.
 * REPLACE THEM with the tenant's own leadership photography (or drop this
 * section) before any real school publishes it. Same for the link glyph: it is
 * a LinkedIn mark, now pointing at internal pages.
 */

type Person = {
  title: string
  role: string
  img: string
  href: string
  linkLabel: string
  bio: string[] // paragraphs, separated by a blank line
}

const PEOPLE: Person[] = [
  {
    title: "Office of the Principal",
    role: "School Leadership",
    img: "raman",
    href: "/inquiry",
    linkLabel: "Contact the principal's office",
    bio: [
      "Our principal still teaches one class a week — the person who sets the standard should be in the room where it is met. Every family gets an open door, not an appointment three weeks out, and most weeks somebody takes it.",
      "Leadership here is measured by how each child is doing, not by how the school looks from outside.",
    ],
  },
  {
    title: "Our Teaching Faculty",
    role: "Academics",
    img: "haseeb",
    href: "/academic",
    linkLabel: "See what we teach",
    bio: [
      "Our teachers are subject specialists, and they stay with a year group long enough to know what each child finds easy, what they avoid, and what finally makes it click.",
      "They plan together, sit in on one another's lessons, and keep studying themselves — the same thing we ask of our students.",
    ],
  },
]

function LinkedInIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 23 23"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      role="img"
    >
      <path
        d="M20.2794 0.289551C20.9393 0.289551 21.5721 0.551684 22.0387 1.01828C22.5053 1.48488 22.7674 2.11773 22.7674 2.7776V20.1939C22.7674 20.8538 22.5053 21.4867 22.0387 21.9533C21.5721 22.4199 20.9393 22.682 20.2794 22.682H2.86305C2.20318 22.682 1.57033 22.4199 1.10373 21.9533C0.637133 21.4867 0.375 20.8538 0.375 20.1939V2.7776C0.375 2.11773 0.637133 1.48488 1.10373 1.01828C1.57033 0.551684 2.20318 0.289551 2.86305 0.289551H20.2794ZM19.6574 19.5719V12.9786C19.6574 11.903 19.2301 10.8715 18.4696 10.1109C17.709 9.35036 16.6775 8.92308 15.6019 8.92308C14.5444 8.92308 13.3129 9.56998 12.7157 10.5403V9.15945H9.2449V19.5719H12.7157V13.4389C12.7157 12.481 13.487 11.6973 14.4449 11.6973C14.9068 11.6973 15.3498 11.8808 15.6764 12.2074C16.0031 12.534 16.1866 12.977 16.1866 13.4389V19.5719H19.6574ZM5.20182 7.20633C5.75611 7.20633 6.2877 6.98614 6.67964 6.59419C7.07159 6.20225 7.29178 5.67066 7.29178 5.11637C7.29178 3.95942 6.35876 3.01397 5.20182 3.01397C4.64422 3.01397 4.10947 3.23547 3.71519 3.62974C3.32092 4.02402 3.09941 4.55878 3.09941 5.11637C3.09941 6.27331 4.04487 7.20633 5.20182 7.20633ZM6.93101 19.5719V9.15945H3.48506V19.5719H6.93101Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function Makers({ lang = "en" }: { lang?: string }) {
  return (
    <section className="section_about-makers">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-medium">
          <div className="about-makers_wrap">
            <div className="about-makers_header">
              <div className="tag is-text is-grey">OUR PEOPLE</div>
              <h2 className="about-makers_heading heading-style-h2">
                Meet the people your child sees every day
              </h2>
            </div>

            <div className="padding-bottom padding-xlarge" />

            <div className="about-makers_grid">
              {PEOPLE.map((m) => (
                <div key={m.title} className="about-makers_block">
                  <div className="about-makers_img-parent">
                    <div className="about-makers_img-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/images/about/${m.img}.webp`}
                        alt=""
                        loading="lazy"
                        className="img-auto"
                      />
                    </div>
                    <div className="about-makers_img-bg" />
                  </div>

                  <div className="about-makers_content">
                    <div className="about-makers_bio">
                      <div className="padding-bottom padding-small">
                        <div className="about_makers_head">
                          <div className="about_makers_heading text-weight-medium font-dm-sans">
                            {m.title}
                          </div>
                          <div className="about-makers_social-wrap">
                            <a
                              aria-label={m.linkLabel}
                              href={`/${lang}${m.href}`}
                              className="about-makers_social-link w-inline-block"
                            >
                              <div className="svg-embed w-embed">
                                <LinkedInIcon />
                              </div>
                            </a>
                          </div>
                        </div>
                        <div className="text-size-regular text-color-grey text-style-allcaps">
                          {m.role}
                        </div>
                      </div>
                      <p className="text-size-regular">
                        {m.bio.map((para, i) => (
                          <span key={i}>
                            {i > 0 && (
                              <>
                                <br />
                                <br />
                              </>
                            )}
                            {para}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
