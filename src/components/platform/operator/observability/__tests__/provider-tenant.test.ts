import { describe, it, expect, vi } from 'vitest'
import { fetchLogs } from '../../observability/provider'
import * as dbMod from '@/lib/db'

describe('observability/provider tenant scoping', () => {
  it('passes tenantId as schoolId in where clause', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOG_PROVIDER', 'db')
    const mockFindMany = vi.fn().mockResolvedValue([])
    const mockCount = vi.fn().mockResolvedValue(0)
    vi.spyOn(dbMod, 'db', 'get').mockReturnValue({
      $transaction: (fns: any[]) => Promise.all(fns.map((fn) => fn)),
      auditLog: { findMany: (...args: any[]) => mockFindMany(...args), count: mockCount },
      user: { findUnique: vi.fn() },
      school: { findUnique: vi.fn() },
    } as any)

    await fetchLogs({ page: 1, perPage: 10, tenantId: 'tenant-123' })
    const arg = mockFindMany.mock.calls[0][0]
    expect(arg.where.schoolId).toBe('tenant-123')
  })
})
















