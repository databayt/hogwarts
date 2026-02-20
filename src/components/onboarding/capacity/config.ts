import { CapacityField, CapacityLimits } from "./types"

export const CAPACITY_LIMITS: CapacityLimits = {
  students: {
    min: 20,
    max: 2000,
    step: 20,
  },
  teachers: {
    min: 1,
    max: 200,
    step: 1,
  },
  classrooms: {
    min: 1,
    max: 100,
    step: 1,
  },
} as const

export const CAPACITY_FIELDS: CapacityField[] = [
  {
    id: "students",
    label: "Students",
    description: "Maximum number of enrolled students",
    minValue: CAPACITY_LIMITS.students.min,
    step: CAPACITY_LIMITS.students.step,
  },
  {
    id: "teachers",
    label: "Teachers",
    description: "Total teaching staff capacity",
    minValue: CAPACITY_LIMITS.teachers.min,
    step: CAPACITY_LIMITS.teachers.step,
  },
  {
    id: "classrooms",
    label: "Class Sections",
    description: "Maximum number of class sections your school plan allows",
    minValue: CAPACITY_LIMITS.classrooms.min,
    step: CAPACITY_LIMITS.classrooms.step,
  },
] as const

export const CAPACITY_MESSAGES = {
  STUDENTS_REQUIRED: "Student capacity is required",
  TEACHERS_REQUIRED: "Teacher capacity is required",
  CLASSROOMS_REQUIRED: "Number of class sections is required",
  INVALID_STUDENTS: `Student count must be between ${CAPACITY_LIMITS.students.min} and ${CAPACITY_LIMITS.students.max}`,
  INVALID_TEACHERS: `Teacher count must be between ${CAPACITY_LIMITS.teachers.min} and ${CAPACITY_LIMITS.teachers.max}`,
  INVALID_CLASSROOMS: `Class sections must be between ${CAPACITY_LIMITS.classrooms.min} and ${CAPACITY_LIMITS.classrooms.max}`,
  STUDENT_TEACHER_RATIO: "Student to teacher ratio is too high",
  STUDENT_CLASSROOM_RATIO: "Student to classroom ratio is too high",
} as const
