// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Core components
export { TrendingStats } from "./trending-stats"
export {
  ProgressStats,
  ProgressStatInline,
  ProgressStatStacked,
} from "./progress-stats"

// Presets - Education
export {
  EducationDashboardStats,
  TeacherDashboardStats,
  StudentDashboardStats,
  ParentDashboardStats,
  PrincipalDashboardStats,
  AdminDashboardStats,
  StaffDashboardStats,
} from "./presets/education"

// Presets - Finance
export {
  FinanceStats,
  AccountantDashboardStats,
  RevenueBreakdown,
  CollectionProgress,
} from "./presets/finance"

// Presets - Attendance
export {
  AttendanceStats,
  AttendanceBreakdown,
  AttendanceRate,
  ClassAttendanceComparison,
} from "./presets/attendance"

// Presets - Admission
export {
  AdmissionStats,
  AdmissionPipeline,
  SeatUtilization,
  AdmissionDashboardFull,
} from "./presets/admission"

// Types
export type {
  TrendDirection,
  StatVariant,
  StatSize,
  TrendData,
  TrendingStatItem,
  ProgressStatItem,
  UsageStatItem,
  StatGridConfig,
  EducationDashboardStatsData,
  FinanceStatsData,
  AttendanceStatsData,
  AdmissionStatsData,
  StatsDictionary,
} from "./types"
