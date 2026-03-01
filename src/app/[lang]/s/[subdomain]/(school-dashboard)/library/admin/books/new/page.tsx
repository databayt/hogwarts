// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

// Direct book creation is deprecated — all books come from the catalog.
// Redirect to the contribute page instead.
export default function LibraryAdminBooksNew() {
  redirect("/library/contribute")
}
