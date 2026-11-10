// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Who is ON a class's roster — the students a register is written for and a
// class notice goes to.
//
// It was "every student placed in the section". A student who is archived or
// no longer active keeps their `sectionId`, so they were marked ABSENT in
// every synced register and sent every class notice: four archived students
// at the first school to go online, in four different classes.
//
// A plain predicate, spread into each roster query, so the three readers (the
// register, the after-class review, the notice audience) cannot drift.

export const ON_ROSTER = {
  status: "ACTIVE",
  archivedAt: null,
} as const
