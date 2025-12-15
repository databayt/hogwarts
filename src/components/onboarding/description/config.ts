import { SchoolLevel, SchoolType } from "./types"

export const SCHOOL_LEVELS: SchoolLevel[] = [
  {
    id: "primary",
    title: "Primary School",
    description: "Elementary education (typically ages 6-11)",
  },
  {
    id: "secondary",
    title: "Secondary School",
    description: "Middle and high school education (typically ages 12-18)",
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
]
