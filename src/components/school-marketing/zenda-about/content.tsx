// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported from zenda (about/content) — section order and motion verbatim, copy
// rewritten for the school tenant. Renders under the `.zenda-clone` CSS scope
// (see src/styles/zenda-clone.css).
//
// <Investors/> and <Trusted/> still carry the reference's real third-party
// logos (its venture investors, and four real accrediting councils). Read the
// blocking notes in those two files before this page goes in front of a real
// school — their marks have to be replaced or the sections dropped.

import type { Dictionary } from "@/components/internationalization/dictionaries"

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

interface AboutContentProps {
  lang?: string
  dictionary?: Dictionary
}

export function AboutContent({ lang = "en", dictionary }: AboutContentProps) {
  return (
    <>
      <Hero dictionary={dictionary} />
      <Work dictionary={dictionary} />
      <Cities dictionary={dictionary} />
      <Team dictionary={dictionary} />
      <Makers lang={lang} dictionary={dictionary} />
      <Investors dictionary={dictionary} />
      <Mission dictionary={dictionary} />
      <Values dictionary={dictionary} />
      <Trusted dictionary={dictionary} />
      <Events lang={lang} dictionary={dictionary} />
    </>
  )
}
