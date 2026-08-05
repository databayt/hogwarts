// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (about/mission). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

/**
 * About "Our Mission" — a two-column block: on the left a purple eyebrow,
 * heading and an illustration; on the right a white rounded card with three
 * paragraphs. Static. Ported from zenda.com/about-us.
 */

const PARAGRAPHS = [
  "Unlike sectors such as food-delivery or ride-hailing, last mile customer experience for parents and institutions still remains full of friction.",
  "Outdated processes and behaviours persist and true innovation has lagged. Our aspiration is to redesign transaction services, purpose-built to address the specific needs of schools and families.",
  "Not as an extension of generic systems, but as solutions thoughtfully designed for the realities of the education sector, so they can focus on what truly matters.",
]

export function Mission() {
  return (
    <section className="section_about-mission">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-large">
          <div className="about-mission_wrap">
            <div className="about-mission_content-left">
              <div className="about-mission_header">
                <div className="tag is-text">Our Mission</div>
                <h2 className="about-mission_heading heading-style-h2">
                  We are passionate about making lives simpler.
                </h2>
              </div>
              <div className="about-mission_img-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/about/mission.webp"
                  alt="Illustration of a diverse group celebrating together"
                  loading="lazy"
                  className="img-auto"
                />
              </div>
            </div>

            <div className="about-mission_content">
              {PARAGRAPHS.map((para, i) => (
                <p key={i} className="heading-style-h5 font-dm-sans">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
