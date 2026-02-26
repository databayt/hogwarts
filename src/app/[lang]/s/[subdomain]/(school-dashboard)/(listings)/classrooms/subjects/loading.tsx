// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SkeletonDataTable } from "@/components/atom/loading"

export default function Loading() {
  return <SkeletonDataTable columns={6} rows={12} />
}
