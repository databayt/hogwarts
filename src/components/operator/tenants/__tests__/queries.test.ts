import { describe, it, expect, vi } from 'vitest'
import * as dbMod from '@/lib/db'
import { getTenants } from '../queries'

vi.mock('@/lib/db', () => {
  return {
    db: {
      school: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
    },
  }
})

describe('tenants queries', () => {
  it('returns empty data and zero pageCount when no rows', async () => {
    const res = await getTenants({ page: 1, perPage: 10, sort: [], search: '' })
    expect(res).toEqual({ data: [], pageCount: 0 })
  })

  it('applies search, plan and status filters and returns pageCount', async () => {
    const mockFindMany = vi.fn().mockResolvedValue([
      { id: '1', name: 'Alpha', domain: 'alpha', isActive: true, planType: 'basic', createdAt: new Date() },
    ])
    const mockCount = vi.fn().mockResolvedValue(1)
    vi.spyOn(dbMod, 'db', 'get').mockReturnValue({
      $transaction: (fns: any[]) => Promise.all(fns.map((fn) => fn)),
      school: { findMany: mockFindMany, count: mockCount },
    } as any)

    const res = await getTenants({ page: 1, perPage: 10, search: 'alp', plan: 'basic', status: 'true', sort: [{ id: 'createdAt', desc: true }] })
    expect(mockFindMany).toHaveBeenCalled()
    expect(res.pageCount).toBe(1)
    expect(res.data[0].name).toBe('Alpha')
  })
})



