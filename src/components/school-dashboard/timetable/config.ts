export const DAYS_OF_WEEK = [
  { id: 0, name: "Sunday", short: "Sun" },
  { id: 1, name: "Monday", short: "Mon" },
  { id: 2, name: "Tuesday", short: "Tue" },
  { id: 3, name: "Wednesday", short: "Wed" },
  { id: 4, name: "Thursday", short: "Thu" },
  { id: 5, name: "Friday", short: "Fri" },
  { id: 6, name: "Saturday", short: "Sat" },
]

export const SUBJECT_COLORS = {
  // Core subjects
  Mathematics: "#3B82F6", // Blue
  English: "#10B981", // Green
  Science: "#8B5CF6", // Purple
  Physics: "#6366F1", // Indigo
  Chemistry: "#EC4899", // Pink
  Biology: "#14B8A6", // Teal
  History: "#F59E0B", // Amber
  Geography: "#84CC16", // Lime

  // Languages
  Arabic: "#0EA5E9", // Sky
  French: "#F43F5E", // Rose
  Spanish: "#EF4444", // Red
  German: "#374151", // Gray

  // Technical
  "Computer Science": "#6366F1", // Indigo
  IT: "#8B5CF6", // Violet

  // Arts & PE
  Art: "#F97316", // Orange
  Music: "#A855F7", // Purple
  PE: "#22C55E", // Green
  Sports: "#16A34A", // Green-dark

  // Others
  Library: "#94A3B8", // Slate
  Assembly: "#64748B", // Slate-dark
  Break: "#E5E7EB", // Gray-light
  Lunch: "#FEF3C7", // Yellow-light

  // Default
  default: "#9CA3AF", // Gray
}

export const CLASSROOM_TYPES = [
  { value: "regular", label: "Regular Classroom", icon: "🏫" },
  { value: "lab", label: "Laboratory", icon: "🔬" },
  { value: "computer", label: "Computer Lab", icon: "💻" },
  { value: "gym", label: "Gymnasium", icon: "🏃" },
  { value: "library", label: "Library", icon: "📚" },
  { value: "music", label: "Music Room", icon: "🎵" },
  { value: "art", label: "Art Room", icon: "🎨" },
]

export const PERIOD_TYPES = [
  { value: "regular", label: "Regular Class", duration: 45 },
  { value: "lunch", label: "Lunch Break", duration: 60 },
  { value: "break", label: "Short Break", duration: 15 },
  { value: "assembly", label: "Assembly", duration: 30 },
]

export const NOTIFICATION_TEMPLATES = {
  SCHEDULE_CHANGE: {
    title: "Schedule Change",
    message:
      "Your {{subject}} class has been moved from {{oldTime}} to {{newTime}} on {{date}}",
  },
  SUBSTITUTE_TEACHER: {
    title: "Substitute Teacher",
    message:
      "{{substituteTeacher}} will be taking your {{subject}} class on {{date}} instead of {{originalTeacher}}",
  },
  CLASS_CANCELLED: {
    title: "Class Cancelled",
    message:
      "Your {{subject}} class on {{date}} at {{time}} has been cancelled",
  },
  ROOM_CHANGE: {
    title: "Room Change",
    message:
      "Your {{subject}} class will be in {{newRoom}} instead of {{oldRoom}} on {{date}}",
  },
  CONFLICT_DETECTED: {
    title: "Schedule Conflict",
    message: "A conflict has been detected: {{conflictDetails}}",
  },
}

export const WORKLOAD_LIMITS = {
  TEACHER_MAX_HOURS_PER_DAY: 6,
  TEACHER_MAX_HOURS_PER_WEEK: 30,
  TEACHER_MAX_CONSECUTIVE_HOURS: 3,
  STUDENT_MAX_HOURS_PER_DAY: 7,
  CLASS_MAX_HOURS_PER_SUBJECT_PER_WEEK: 5,
}

export const GRID_SETTINGS = {
  CELL_MIN_HEIGHT: 60,
  CELL_MIN_WIDTH: 120,
  HEADER_HEIGHT: 50,
  TIME_COLUMN_WIDTH: 80,
  MOBILE_BREAKPOINT: 768,
  PRINT_MARGIN: 20,
}

export const EXPORT_FORMATS = [
  { value: "pdf", label: "PDF Document", icon: "📄" },
  { value: "excel", label: "Excel Spreadsheet", icon: "📊" },
  { value: "csv", label: "CSV File", icon: "📋" },
  { value: "image", label: "PNG Image", icon: "🖼️" },
  { value: "ical", label: "Calendar (iCal)", icon: "📅" },
]

export const VIEW_MODES = [
  { value: "class", label: "Class View", icon: "👥" },
  { value: "teacher", label: "Teacher View", icon: "👨‍🏫" },
  { value: "room", label: "Room View", icon: "🚪" },
  { value: "student", label: "Student View", icon: "👤" },
]

export const DRAG_DROP_MODES = [
  { value: "move", label: "Move", description: "Move slot to new position" },
  {
    value: "copy",
    label: "Copy",
    description: "Duplicate slot to new position",
  },
  {
    value: "swap",
    label: "Swap",
    description: "Exchange slots between positions",
  },
]

export const DEFAULT_SETTINGS = {
  workingDays: [1, 2, 3, 4, 5], // Mon-Fri
  periodsPerDay: 8,
  defaultPeriodDuration: 45,
  lunchAfterPeriod: 4,
  breakAfterPeriod: [2, 6],
  allowConflicts: false,
  autoResolveConflicts: true,
  notifyOnChanges: true,
  colorScheme: "subject" as const,
  viewPreference: "class" as const,
}

export const VALIDATION_RULES = {
  MIN_PERIOD_DURATION: 15,
  MAX_PERIOD_DURATION: 120,
  MAX_PERIODS_PER_DAY: 12,
  MIN_BREAK_DURATION: 5,
  MAX_CLASS_SIZE: 50,
  MIN_TEACHER_BREAK_BETWEEN_CLASSES: 5,
}

export const ANALYTICS_METRICS = [
  { id: "utilization", label: "Utilization Rate", unit: "%" },
  { id: "conflicts", label: "Active Conflicts", unit: "count" },
  { id: "workload", label: "Average Workload", unit: "hours/week" },
  { id: "coverage", label: "Subject Coverage", unit: "%" },
  { id: "efficiency", label: "Schedule Efficiency", unit: "score" },
]

export const QUICK_ACTIONS = [
  { id: "add_slot", label: "Add Slot", icon: "➕", shortcut: "Ctrl+N" },
  {
    id: "find_substitute",
    label: "Find Substitute",
    icon: "🔄",
    shortcut: "Ctrl+S",
  },
  {
    id: "check_conflicts",
    label: "Check Conflicts",
    icon: "⚠️",
    shortcut: "Ctrl+K",
  },
  { id: "export", label: "Export", icon: "📥", shortcut: "Ctrl+E" },
  { id: "print", label: "Print", icon: "🖨️", shortcut: "Ctrl+P" },
]
