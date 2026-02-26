// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import crypto from "node:crypto"

export function saltAndHashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex")
  return { salt, hash }
}
