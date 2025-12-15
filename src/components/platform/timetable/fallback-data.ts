// Fallback data for when main timetable data is unavailable
export const FALLBACK_SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "History",
  "Geography",
  "Literature",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Art",
  "Music",
  "Physical Education",
  "Social Studies",
  "Foreign Language",
]

export const FALLBACK_TIMETABLE_DATA = {
  days: [1, 2, 3, 4, 5], // Mon-Fri
  day_time: [
    "1(08:30~09:20)",
    "2(09:30~10:20)",
    "3(10:30~11:20)",
    "4(11:30~12:20)",
    "5(13:20~14:10)",
    "6(14:20~15:10)",
    "7(15:20~16:10)",
  ],
  timetable: [
    // Monday
    [
      {
        period: 1,
        subject: "Mathematics",
        teacher: "Mr. Smith",
        replaced: false,
        original: null,
      },
      {
        period: 2,
        subject: "Science",
        teacher: "Ms. Johnson",
        replaced: false,
        original: null,
      },
      {
        period: 3,
        subject: "English",
        teacher: "Mrs. Davis",
        replaced: false,
        original: null,
      },
      {
        period: 4,
        subject: "History",
        teacher: "Mr. Wilson",
        replaced: false,
        original: null,
      },
      {
        period: 5,
        subject: "Art",
        teacher: "Ms. Brown",
        replaced: false,
        original: null,
      },
      {
        period: 6,
        subject: "Physical Education",
        teacher: "Mr. Taylor",
        replaced: false,
        original: null,
      },
      {
        period: 7,
        subject: "Computer Science",
        teacher: "Ms. Garcia",
        replaced: false,
        original: null,
      },
    ],
    // Tuesday
    [
      {
        period: 1,
        subject: "Science",
        teacher: "Ms. Johnson",
        replaced: false,
        original: null,
      },
      {
        period: 2,
        subject: "Mathematics",
        teacher: "Mr. Smith",
        replaced: false,
        original: null,
      },
      {
        period: 3,
        subject: "Geography",
        teacher: "Mr. Anderson",
        replaced: false,
        original: null,
      },
      {
        period: 4,
        subject: "English",
        teacher: "Mrs. Davis",
        replaced: false,
        original: null,
      },
      {
        period: 5,
        subject: "Music",
        teacher: "Ms. Lee",
        replaced: false,
        original: null,
      },
      {
        period: 6,
        subject: "Literature",
        teacher: "Mrs. White",
        replaced: false,
        original: null,
      },
      {
        period: 7,
        subject: "Foreign Language",
        teacher: "Mr. Rodriguez",
        replaced: false,
        original: null,
      },
    ],
    // Wednesday
    [
      {
        period: 1,
        subject: "English",
        teacher: "Mrs. Davis",
        replaced: false,
        original: null,
      },
      {
        period: 2,
        subject: "Physics",
        teacher: "Dr. Thompson",
        replaced: false,
        original: null,
      },
      {
        period: 3,
        subject: "Mathematics",
        teacher: "Mr. Smith",
        replaced: false,
        original: null,
      },
      {
        period: 4,
        subject: "Chemistry",
        teacher: "Dr. Martinez",
        replaced: false,
        original: null,
      },
      {
        period: 5,
        subject: "Social Studies",
        teacher: "Ms. Clark",
        replaced: false,
        original: null,
      },
      {
        period: 6,
        subject: "Biology",
        teacher: "Dr. Lewis",
        replaced: false,
        original: null,
      },
      {
        period: 7,
        subject: "Physical Education",
        teacher: "Mr. Taylor",
        replaced: false,
        original: null,
      },
    ],
    // Thursday
    [
      {
        period: 1,
        subject: "History",
        teacher: "Mr. Wilson",
        replaced: false,
        original: null,
      },
      {
        period: 2,
        subject: "Mathematics",
        teacher: "Mr. Smith",
        replaced: false,
        original: null,
      },
      {
        period: 3,
        subject: "English",
        teacher: "Mrs. Davis",
        replaced: false,
        original: null,
      },
      {
        period: 4,
        subject: "Science",
        teacher: "Ms. Johnson",
        replaced: false,
        original: null,
      },
      {
        period: 5,
        subject: "Art",
        teacher: "Ms. Brown",
        replaced: false,
        original: null,
      },
      {
        period: 6,
        subject: "Computer Science",
        teacher: "Ms. Garcia",
        replaced: false,
        original: null,
      },
      {
        period: 7,
        subject: "Literature",
        teacher: "Mrs. White",
        replaced: false,
        original: null,
      },
    ],
    // Friday
    [
      {
        period: 1,
        subject: "Geography",
        teacher: "Mr. Anderson",
        replaced: false,
        original: null,
      },
      {
        period: 2,
        subject: "English",
        teacher: "Mrs. Davis",
        replaced: false,
        original: null,
      },
      {
        period: 3,
        subject: "Mathematics",
        teacher: "Mr. Smith",
        replaced: false,
        original: null,
      },
      {
        period: 4,
        subject: "Music",
        teacher: "Ms. Lee",
        replaced: false,
        original: null,
      },
      {
        period: 5,
        subject: "Science",
        teacher: "Ms. Johnson",
        replaced: false,
        original: null,
      },
      {
        period: 6,
        subject: "Physical Education",
        teacher: "Mr. Taylor",
        replaced: false,
        original: null,
      },
      {
        period: 7,
        subject: "Foreign Language",
        teacher: "Mr. Rodriguez",
        replaced: false,
        original: null,
      },
    ],
  ],
  update_date: "2024-01-01",
  lunchAfterPeriod: 4,
}

export function getFallbackTimetableData() {
  return FALLBACK_TIMETABLE_DATA
}

export function getAllSubjects() {
  return FALLBACK_SUBJECTS
}
