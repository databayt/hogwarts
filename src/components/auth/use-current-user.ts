// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useSession } from "next-auth/react"

export const useCurrentUser = () => {
  const session = useSession()

  return session.data?.user
}
