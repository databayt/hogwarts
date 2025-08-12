import { createSearchParamsCache, parseAsInteger, parseAsString } from 'nuqs/server'

export const attendanceReportParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  studentId: parseAsString.withDefault(''),
  classId: parseAsString.withDefault(''),
  status: parseAsString.withDefault(''), // present|absent|late|
  from: parseAsString.withDefault(''),
  to: parseAsString.withDefault(''),
})

export type AttendanceReportSearch = Awaited<ReturnType<typeof attendanceReportParams.parse>>








