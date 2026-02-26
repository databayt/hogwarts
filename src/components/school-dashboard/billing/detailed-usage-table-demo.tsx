"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { DetailedUsageTable } from "@/components/billingsdk/detailed-usage-table"

const demoResources = [
  {
    name: "Students",
    used: 245,
    limit: 500,
    percentage: 49,
    unit: "users",
  },
  {
    name: "Teachers",
    used: 18,
    limit: 50,
    percentage: 36,
    unit: "users",
  },
  {
    name: "Classes",
    used: 42,
    limit: 100,
    percentage: 42,
    unit: "classes",
  },
  {
    name: "Storage",
    used: 2500,
    limit: 5000,
    percentage: 50,
    unit: "MB",
  },
]

export function DetailedUsageTableDemo() {
  return (
    <DetailedUsageTable
      title="Resource Usage"
      description="Current usage across your school's resources"
      resources={demoResources}
    />
  )
}
