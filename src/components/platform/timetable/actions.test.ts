import { describe, it, expect, vi } from 'vitest'

vi.mock('@/components/platform/operator/lib/tenant', () => ({
  getTenantContext: vi.fn().mockResolvedValue({ schoolId: 's1' }),
}))

const findMany = vi.fn().mockResolvedValue([
  {
    id: 'c1', name: 'Class 1', teacherId: 't1', classroomId: 'r1',
    startPeriod: { startTime: new Date('2024-01-01T08:00:00Z') },
    endPeriod: { endTime: new Date('2024-01-01T09:00:00Z') },
    teacher: { givenName: 'Albus', surname: 'Dumbledore' },
    classroom: { roomName: 'Room A' },
  },
  {
    id: 'c2', name: 'Class 2', teacherId: 't1', classroomId: 'r2',
    startPeriod: { startTime: new Date('2024-01-01T08:30:00Z') },
    endPeriod: { endTime: new Date('2024-01-01T09:30:00Z') },
    teacher: { givenName: 'Albus', surname: 'Dumbledore' },
    classroom: { roomName: 'Room B' },
  },
])

vi.mock('@/lib/db', () => ({
  db: { class: { findMany } },
}))

import { detectTimetableConflicts } from '@/components/platform/timetable/actions'

describe('timetable conflicts', () => {
  it('detects teacher conflict on overlapping times', async () => {
    const res = await detectTimetableConflicts({})
    expect(res.conflicts.some(c => c.type === 'TEACHER')).toBe(true)
  })
})


