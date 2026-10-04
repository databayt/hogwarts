// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Client-safe helpers shared by the assignment board, editor and server code.
// Keep this file free of server imports — client components import it.

/** Board/editor key for one subject in one section. */
export const cellKey = (sectionId: string, subjectId: string) =>
  `${sectionId}:${subjectId}`
