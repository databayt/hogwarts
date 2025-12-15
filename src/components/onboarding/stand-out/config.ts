import type { StandOutFeature } from "./types"

export const STAND_OUT_CONSTANTS = {
  STEP_NAME: "stand-out",
  STEP_TITLE: "What Makes You Stand Out",
  STEP_DESCRIPTION: "Highlight what makes your school unique and special.",
  MAX_FEATURES: 8,
  MIN_FEATURES: 0,
} as const

export const STAND_OUT_FEATURES: StandOutFeature[] = [
  // Academic Excellence
  {
    id: "small-class-sizes",
    label: "Small Class Sizes",
    description: "Personalized attention with low student-teacher ratios",
    category: "academic",
  },
  {
    id: "stem-focus",
    label: "STEM Excellence",
    description: "Strong focus on Science, Technology, Engineering, and Math",
    category: "academic",
  },
  {
    id: "multilingual",
    label: "Multilingual Education",
    description: "Teaching in multiple languages",
    category: "academic",
  },
  {
    id: "advanced-placement",
    label: "Advanced Placement",
    description: "College-level courses and programs",
    category: "academic",
  },

  // Facilities & Resources
  {
    id: "modern-facilities",
    label: "Modern Facilities",
    description: "State-of-the-art classrooms and equipment",
    category: "facilities",
  },
  {
    id: "technology-integration",
    label: "Technology Integration",
    description: "Latest educational technology and digital tools",
    category: "facilities",
  },
  {
    id: "sports-facilities",
    label: "Excellent Sports Facilities",
    description: "Top-notch athletic facilities and programs",
    category: "facilities",
  },
  {
    id: "library-resources",
    label: "Comprehensive Library",
    description: "Extensive library and research resources",
    category: "facilities",
  },

  // Special Programs
  {
    id: "arts-program",
    label: "Strong Arts Program",
    description: "Music, visual arts, and performing arts programs",
    category: "programs",
  },
  {
    id: "special-needs",
    label: "Special Needs Support",
    description: "Dedicated support for students with special needs",
    category: "programs",
  },
  {
    id: "extracurricular",
    label: "Rich Extracurricular Activities",
    description: "Wide variety of clubs and after-school programs",
    category: "programs",
  },
  {
    id: "community-service",
    label: "Community Service Focus",
    description: "Strong emphasis on community involvement and service",
    category: "programs",
  },

  // Achievements & Recognition
  {
    id: "awards-recognition",
    label: "Awards & Recognition",
    description: "Recognized excellence in education",
    category: "achievements",
  },
  {
    id: "high-graduation-rate",
    label: "High Graduation Rate",
    description: "Excellent student success and completion rates",
    category: "achievements",
  },
  {
    id: "college-preparation",
    label: "College Preparation",
    description: "Strong track record of college admissions",
    category: "achievements",
  },
  {
    id: "experienced-faculty",
    label: "Experienced Faculty",
    description: "Highly qualified and experienced teaching staff",
    category: "achievements",
  },
] as const

export const FEATURE_CATEGORIES = {
  academic: {
    label: "Academic Excellence",
    description: "Educational quality and teaching methods",
    color: "blue",
  },
  facilities: {
    label: "Facilities & Resources",
    description: "Physical infrastructure and resources",
    color: "green",
  },
  programs: {
    label: "Special Programs",
    description: "Unique programs and activities",
    color: "purple",
  },
  achievements: {
    label: "Achievements & Recognition",
    description: "Awards, recognition, and success metrics",
    color: "orange",
  },
} as const

export const VALIDATION_MESSAGES = {
  MAX_FEATURES_EXCEEDED: `You can select up to ${STAND_OUT_CONSTANTS.MAX_FEATURES} features`,
  DESCRIPTION_TOO_LONG: "Description must be less than 500 characters",
} as const
