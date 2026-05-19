// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SchoolLevel, SchoolType } from "./types"

export const SCHOOL_LEVELS: SchoolLevel[] = [
  {
    id: "primary",
    title: "Primary School",
    description: "Elementary education (typically ages 6-11)",
  },
  {
    id: "middle",
    title: "Middle School",
    description: "Intermediate education (typically ages 12-14)",
  },
  {
    id: "secondary",
    title: "Secondary School",
    description: "High school education (typically ages 15-18)",
  },
  {
    id: "both",
    title: "Primary & Secondary",
    description: "Complete K-12 education system",
  },
]

export const SCHOOL_TYPES: SchoolType[] = [
  {
    id: "private",
    title: "Private",
    description: "Independently funded and operated",
  },
  {
    id: "public",
    title: "Public",
    description: "Government funded and operated",
  },
  {
    id: "international",
    title: "International",
    description: "Global curriculum and standards",
  },
  {
    id: "technical",
    title: "Technical",
    description: "Specialized technical education",
  },
  {
    id: "special",
    title: "Special",
    description: "Special education and support",
  },
  {
    id: "national",
    title: "National Curriculum",
    description: "Government ministry standard",
  },
  {
    id: "british",
    title: "British Curriculum",
    description: "IGCSE / A-Levels",
  },
  {
    id: "ib",
    title: "International Baccalaureate",
    description: "IB Diploma Programme",
  },
  {
    id: "american",
    title: "American Curriculum",
    description: "US educational standards",
  },
]
