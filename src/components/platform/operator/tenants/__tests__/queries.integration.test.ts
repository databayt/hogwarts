import { describe, it, expect, vi } from 'vitest'
import * as dbMod from '@/lib/db'
import { getTenants } from '../../tenants/queries'

describe('getTenants integration (where/orderBy mapping)', () => {
  it('maps filters and sorting to Prisma args', async () => {
    const mockFindMany = vi.fn().mockResolvedValue([])
    const mockCount = vi.fn().mockResolvedValue(0)
    vi.spyOn(dbMod, 'db', 'get').mockReturnValue({
      $transaction: (fns: any[]) => Promise.all(fns.map((fn) => fn)),
      school: { findMany: mockFindMany, count: mockCount },
    } as any)

    await getTenants({
      page: 2,
      perPage: 20,
      search: 'alpha',
      name: 'alp',
      domain: 'school',
      planType: 'basic',
      isActive: 'true',
      sort: [{ id: 'createdAt', desc: true }],
    })

    const arg = mockFindMany.mock.calls[0]?.[0]
    expect(arg).toBeTruthy()
    expect(arg.where.name.contains).toBe('alp')
    expect(arg.where.domain.contains).toBe('school')
    expect(arg.where.planType).toBe('basic')
    expect(arg.where.isActive).toBe(true)
    expect(arg.orderBy[0].createdAt).toBe('desc')
  })
})
















