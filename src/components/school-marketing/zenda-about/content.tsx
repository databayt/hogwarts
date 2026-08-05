// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (about/content). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

import { Cities } from "./cities"
import { Events } from "./events"
import { Hero } from "./hero"
import { Investors } from "./investors"
import { Makers } from "./makers"
import { Mission } from "./mission"
import { Team } from "./team"
import { Trusted } from "./trusted"
import { Values } from "./values"
import { Work } from "./work"

export function AboutContent() {
  return (
    <>
      <Hero />
      <Work />
      <Cities />
      <Team />
      <Makers />
      <Investors />
      <Mission />
      <Values />
      <Trusted />
      <Events />
    </>
  )
}
