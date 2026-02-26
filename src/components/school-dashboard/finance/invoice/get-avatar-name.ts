// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export default function getAvatarName(
  firstName: string,
  lastName: string | null
) {
  if (!firstName) {
    return null
  }
  return lastName ? firstName[0] + lastName[0] : firstName[0]
}
