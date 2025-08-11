import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/components/platform/operator/lib/tenant', () => ({
  getTenantContext: vi.fn().mockResolvedValue({ schoolId: 's1' }),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const upsert = vi.fn().mockResolvedValue({})
vi.mock('@/lib/db', () => ({
  db: { attendance: { upsert } },
}))

import { markAttendance, getAttendanceReportCsv } from '@/components/school/dashboard/attendance/actions'

describe('attendance actions', () => {
  beforeEach(() => {
    upsert.mockClear()
  })

  it('maps present|absent|late to enum and upserts per record', async () => {
    await markAttendance({ classId: 'c1', date: new Date().toISOString(), records: [
      { studentId: 'a', status: 'present' },
      { studentId: 'b', status: 'late' },
    ] })
    expect(upsert).toHaveBeenCalledTimes(2)
    const args = upsert.mock.calls.map((c: any[]) => c[0])
    expect(args[0].where.schoolId_studentId_classId_date.schoolId).toBe('s1')
    expect(args[0].create.status).toBe('PRESENT')
    expect(args[1].create.status).toBe('LATE')
  })

  it('generates CSV string from rows', async () => {
    // mock findMany for report
    const findMany = vi.fn().mockResolvedValue([
      { date: new Date('2024-01-01'), studentId: 'stu1', classId: 'c1', status: 'PRESENT' },
    ])
    ;(await import('@/lib/db')).db.attendance = { upsert, findMany } as any
    const csv = await getAttendanceReportCsv({ classId: 'c1' })
    expect(csv.split('\n')[0]).toContain('date,studentId,classId,status')
    expect(csv).toContain('stu1')
  })
})


