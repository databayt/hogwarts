// Evaluation Type Configuration for Course Management
// Supports multiple grading systems: Normal, GPA, CWA, CCE

export const EVALUATION_TYPES = {
  NORMAL: {
    value: "NORMAL",
    label: "Normal (Percentage)",
    description: "Standard percentage-based grading (0-100%)",
    scale: "percentage",
    min: 0,
    max: 100,
  },
  GPA: {
    value: "GPA",
    label: "GPA (Grade Point Average)",
    description: "Grade Point Average on 4.0 scale",
    scale: "gpa",
    min: 0.0,
    max: 4.0,
  },
  CWA: {
    value: "CWA",
    label: "CWA (Cumulative Weighted Average)",
    description: "Weighted average based on credit hours",
    scale: "weighted",
    min: 0,
    max: 100,
  },
  CCE: {
    value: "CCE",
    label: "CCE (Continuous Comprehensive Evaluation)",
    description: "Competency-based continuous assessment",
    scale: "competency",
    min: 0,
    max: 100,
  },
} as const

export type EvaluationType = keyof typeof EVALUATION_TYPES

// GPA Letter Grade Mapping (customizable per school)
export const GPA_LETTER_GRADES = [
  { min: 93, max: 100, letter: "A", gpa: 4.0 },
  { min: 90, max: 92, letter: "A-", gpa: 3.7 },
  { min: 87, max: 89, letter: "B+", gpa: 3.3 },
  { min: 83, max: 86, letter: "B", gpa: 3.0 },
  { min: 80, max: 82, letter: "B-", gpa: 2.7 },
  { min: 77, max: 79, letter: "C+", gpa: 2.3 },
  { min: 73, max: 76, letter: "C", gpa: 2.0 },
  { min: 70, max: 72, letter: "C-", gpa: 1.7 },
  { min: 67, max: 69, letter: "D+", gpa: 1.3 },
  { min: 63, max: 66, letter: "D", gpa: 1.0 },
  { min: 60, max: 62, letter: "D-", gpa: 0.7 },
  { min: 0, max: 59, letter: "F", gpa: 0.0 },
] as const

// Helper function to convert percentage to GPA
export function percentageToGPA(percentage: number): {
  letter: string
  gpa: number
} {
  const grade = GPA_LETTER_GRADES.find(
    (g) => percentage >= g.min && percentage <= g.max
  )
  return grade
    ? { letter: grade.letter, gpa: grade.gpa }
    : { letter: "F", gpa: 0.0 }
}

// Helper function to calculate weighted average
export function calculateWeightedAverage(
  scores: Array<{ score: number; credits: number }>
): number {
  if (scores.length === 0) return 0

  const totalWeightedScore = scores.reduce(
    (sum, { score, credits }) => sum + score * credits,
    0
  )
  const totalCredits = scores.reduce((sum, { credits }) => sum + credits, 0)

  return totalCredits > 0 ? totalWeightedScore / totalCredits : 0
}

// Helper function to calculate cumulative GPA
export function calculateCumulativeGPA(
  courses: Array<{ gpa: number; credits: number }>
): number {
  if (courses.length === 0) return 0

  const totalGradePoints = courses.reduce(
    (sum, { gpa, credits }) => sum + gpa * credits,
    0
  )
  const totalCredits = courses.reduce((sum, { credits }) => sum + credits, 0)

  return totalCredits > 0 ? totalGradePoints / totalCredits : 0
}

// CCE Competency Levels
export const CCE_COMPETENCY_LEVELS = [
  { code: "A", label: "Outstanding", min: 91, max: 100 },
  { code: "B", label: "Excellent", min: 81, max: 90 },
  { code: "C", label: "Good", min: 71, max: 80 },
  { code: "D", label: "Satisfactory", min: 61, max: 70 },
  { code: "E", label: "Needs Improvement", min: 51, max: 60 },
  { code: "F", label: "Unsatisfactory", min: 0, max: 50 },
] as const

// Helper function to get CCE competency level
export function getCCECompetency(score: number): {
  code: string
  label: string
} {
  const level = CCE_COMPETENCY_LEVELS.find(
    (l) => score >= l.min && score <= l.max
  )
  return level
    ? { code: level.code, label: level.label }
    : { code: "F", label: "Unsatisfactory" }
}

// Format score based on evaluation type
export function formatScore(
  score: number,
  evaluationType: EvaluationType
): string {
  switch (evaluationType) {
    case "NORMAL":
      return `${score.toFixed(1)}%`
    case "GPA": {
      const { letter, gpa } = percentageToGPA(score)
      return `${letter} (${gpa.toFixed(2)})`
    }
    case "CWA":
      return `${score.toFixed(2)}`
    case "CCE": {
      const { code, label } = getCCECompetency(score)
      return `${code} - ${label}`
    }
    default:
      return score.toString()
  }
}
