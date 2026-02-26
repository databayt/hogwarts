// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export class RequiresProPlanError extends Error {
  constructor(message = "This action requires a pro plan") {
    super(message)
  }
}
