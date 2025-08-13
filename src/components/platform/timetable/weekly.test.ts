import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/components/platform/operator/lib/tenant', () => ({
  getTenantContext: vi.fn().mockResolvedValue({ schoolId: 's1' }),
}))

const termFindFirst = vi.fn()
const periodFindMany = vi.fn()
const timetableFindMany = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    term: { findFirst: termFindFirst },
    period: { findMany: periodFindMany },
    timetable: { findMany: timetableFindMany },
  },
}))

import { getWeeklyTimetable, suggestFreeSlots, detectTimetableConflicts } from './actions'

describe('weekly timetable actions', () => {
  beforeEach(() => {
    termFindFirst.mockReset()
    periodFindMany.mockReset()
    timetableFindMany.mockReset()
  })

  it('formats weekly timetable with days and lunchAfterPeriod', async () => {
    termFindFirst.mockResolvedValue({ yearId: 'year1' })
    periodFindMany.mockResolvedValue([
      { id: 'p1', name: 'Period 1', startTime: new Date('1970-01-01T08:00:00Z'), endTime: new Date('1970-01-01T08:45:00Z') },
      { id: 'p2', name: 'Period 2', startTime: new Date('1970-01-01T08:50:00Z'), endTime: new Date('1970-01-01T09:35:00Z') },
    ])
    timetableFindMany.mockResolvedValue([
      {
        dayOfWeek: 0,
        periodId: 'p1',
        class: { id: 'c1', name: 'Math 10', subject: { subjectName: 'Math' }, teacher: { givenName: 'Alan', surname: 'Turing' } },
        teacher: { givenName: 'Alan', surname: 'Turing' },
      },
    ])

    const res = await getWeeklyTimetable({ termId: 't1' })
    expect(Array.isArray(res.days)).toBe(true)
    expect(res.day_time.length).toBe(2)
    expect(res.timetable.length).toBeGreaterThan(0)
    expect(typeof res.lunchAfterPeriod === 'number' || res.lunchAfterPeriod === null).toBe(true)
  })

  it('suggests free slots for a teacher', async () => {
    termFindFirst.mockResolvedValue({ yearId: 'year1' })
    periodFindMany.mockResolvedValue([
      { id: 'p1', name: 'Period 1', startTime: new Date('1970-01-01T08:00:00Z'), endTime: new Date('1970-01-01T08:45:00Z') },
      { id: 'p2', name: 'Period 2', startTime: new Date('1970-01-01T08:50:00Z'), endTime: new Date('1970-01-01T09:35:00Z') },
    ])
    timetableFindMany.mockResolvedValue([{ dayOfWeek: 0, periodId: 'p1' }])
    const res = await suggestFreeSlots({ termId: 't1', teacherId: 'teacher-1' })
    expect(res.suggestions.some(s => s.periodId === 'p2')).toBe(true)
  })

  it('detects teacher conflict when same teacher occupies same time', async () => {
    // For conflict detection in timetable mode, stub timetable.findMany grouping
    ;(timetableFindMany as any).mockResolvedValueOnce([
      { dayOfWeek: 0, periodId: 'p1', class: { id: 'c1', name: 'Class 1' }, teacherId: 't1', teacher: { givenName: 'A', surname: 'B' }, classroomId: 'r1', classroom: { roomName: 'R1' } },
      { dayOfWeek: 0, periodId: 'p1', class: { id: 'c2', name: 'Class 2' }, teacherId: 't1', teacher: { givenName: 'A', surname: 'B' }, classroomId: 'r2', classroom: { roomName: 'R2' } },
    ])
    const res = await detectTimetableConflicts({ termId: 't1' })
    expect(res.conflicts.some(c => c.type === 'TEACHER')).toBe(true)
  })
})


