import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchLogs } from '../../observability/provider'
import * as dbMod from '@/lib/db'

describe('observability/provider', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('fetchLogs with db provider maps rows and applies filters', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOG_PROVIDER', 'db')
    const now = new Date()
    const mockFindMany = vi.fn().mockResolvedValue([
      { id: '1', createdAt: now, userId: 'u1', schoolId: 's1', action: 'TEST', reason: 'r', ip: '1.2.3.4' },
    ])
    const mockCount = vi.fn().mockResolvedValue(1)
    vi.spyOn(dbMod, 'db', 'get').mockReturnValue({
      $transaction: (fns: any[]) => Promise.all(fns.map((fn) => fn)),
      auditLog: { findMany: mockFindMany, count: mockCount },
      user: { findUnique: vi.fn().mockResolvedValue({ email: 'a@b.com' }) },
      school: { findUnique: vi.fn().mockResolvedValue({ name: 'Alpha' }) },
    } as any)

    const { rows, total } = await fetchLogs({ page: 1, perPage: 50, action: 'TE', ip: '1.2', from: now.getTime() - 1000, to: now.getTime() })
    expect(total).toBe(1)
    expect(rows[0].action).toBe('TEST')
    expect(rows[0].userEmail).toBe('a@b.com')
    expect(rows[0].schoolName).toBe('Alpha')
  })

  it('fetchLogs with http provider calls external API and maps fields', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOG_PROVIDER', 'http')
    vi.stubEnv('LOG_API_URL', 'https://logs.example.com')
    const fetchSpy = vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        total: 1,
        logs: [
          {
            id: 'l1',
            ts: Date.now(),
            userId: 'u1',
            schoolId: 's1',
            action: 'TEST',
            ip: '1.2.3.4',
            userEmail: 'x@y.z',
            schoolName: 'Alpha',
            level: 'info',
            requestId: 'rid-1',
          },
        ],
      }),
    } as any)

    const res = await fetchLogs({ page: 1, perPage: 10 })
    expect(fetchSpy).toHaveBeenCalled()
    expect(res.total).toBe(1)
    expect(res.rows[0].requestId).toBe('rid-1')
    expect(res.rows[0].level).toBe('info')
  })
})









