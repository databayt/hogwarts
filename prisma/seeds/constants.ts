/**
 * Seed Constants
 * Shared configuration for demo school seeding
 */

// Demo password for all accounts (easy demo access)
export const DEMO_PASSWORD = "1234";

// Demo school configuration
export const DEMO_SCHOOL = {
  domain: "demo",
  name: "Demo International School",
  email: "info@demo.databayt.org",
  website: "https://demo.databayt.org",
  planType: "enterprise",
  maxStudents: 5000,
  maxTeachers: 500,
  timezone: "Africa/Khartoum",
};

// Sudanese/Arabic male names
export const MALE_NAMES = [
  "Ahmed", "Mohamed", "Osman", "Ibrahim", "Khalid", "Hassan", "Ali", "Omar",
  "Abdalla", "Mustafa", "Kamal", "Tariq", "Yousif", "Salih", "Malik", "Bashir",
  "Hamza", "Idris", "Jamal", "Nabil", "Rashid", "Saeed", "Waleed", "Zain",
  "Amin", "Farouk", "Gamal", "Hisham", "Imad", "Jaafar", "Lutfi", "Munir",
];

// Sudanese/Arabic female names
export const FEMALE_NAMES = [
  "Fatima", "Aisha", "Mariam", "Amina", "Khadija", "Huda", "Sara", "Layla",
  "Sumaya", "Rania", "Noura", "Zahra", "Samira", "Hana", "Dalal", "Nawal",
  "Mona", "Rehab", "Safaa", "Tahani", "Widad", "Yasmin", "Zainab", "Amal",
  "Basma", "Dalia", "Eman", "Fadia", "Ghada", "Hiba", "Inas", "Jumana",
];

// Sudanese/Arabic surnames
export const SURNAMES = [
  "Hassan", "Ali", "Ahmed", "Mohamed", "Ibrahim", "Osman", "Yousif", "Salih",
  "Abdalla", "Mustafa", "Khalid", "Omar", "Abdelrahman", "Kamal", "Malik",
  "Bashir", "Hamza", "Idris", "Jamal", "Nabil", "Abbas", "Badawi", "Elsayed",
  "Fadl", "Gaber", "Habib", "Ismail", "Jafar", "Karam", "Latif", "Mahdi",
];

// Year levels (KG through Grade 12)
export const YEAR_LEVELS = [
  "KG 1", "KG 2",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
];

// Departments and their subjects
export const DEPARTMENTS = [
  {
    name: "Languages",
    subjects: ["Arabic Language", "English Language", "French Language"],
  },
  {
    name: "Sciences",
    subjects: ["Mathematics", "Physics", "Chemistry", "Biology", "Environmental Science"],
  },
  {
    name: "Humanities",
    subjects: ["Geography", "History", "Civics", "Economics"],
  },
  {
    name: "Religious Studies",
    subjects: ["Islamic Studies", "Quran"],
  },
  {
    name: "ICT",
    subjects: ["Computer Science", "Information Technology", "Digital Literacy"],
  },
  {
    name: "Arts & Physical Education",
    subjects: ["Art", "Music", "Physical Education", "Health Education"],
  },
];

// Periods configuration
export const PERIODS = [
  { name: "Period 1", startHour: 7, startMin: 45, endHour: 8, endMin: 30 },
  { name: "Period 2", startHour: 8, startMin: 35, endHour: 9, endMin: 20 },
  { name: "Period 3", startHour: 9, startMin: 30, endHour: 10, endMin: 15 },
  { name: "Period 4", startHour: 10, startMin: 25, endHour: 11, endMin: 10 },
  { name: "Period 5", startHour: 11, startMin: 20, endHour: 12, endMin: 5 },
  { name: "Period 6", startHour: 12, startMin: 15, endHour: 13, endMin: 0 },
  { name: "Period 7", startHour: 13, startMin: 45, endHour: 14, endMin: 30 },
  { name: "Period 8", startHour: 14, startMin: 35, endHour: 15, endMin: 20 },
];

// Working days (Sun-Thu)
export const WORKING_DAYS = [0, 1, 2, 3, 4];

// Helper functions
export function getRandomName(gender: "M" | "F"): { givenName: string; surname: string } {
  const names = gender === "M" ? MALE_NAMES : FEMALE_NAMES;
  return {
    givenName: names[Math.floor(Math.random() * names.length)],
    surname: SURNAMES[Math.floor(Math.random() * SURNAMES.length)],
  };
}

export function timeAt(hour: number, minute = 0): Date {
  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
}
