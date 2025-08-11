import { describe, it, expect, vi } from 'vitest'
import * as actions from '@/app/(platform)/operator/actions/domains/create'

vi.mock('@/lib/db', () => {
  return {
    db: {
      domainRequest: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: '1' }),
      },
    },
  }
})

vi.mock('@/components/platform/operator/lib/audit', () => ({
  logOperatorAudit: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/components/platform/operator/lib/auth', () => ({
  getOperatorContext: vi.fn().mockResolvedValue({ operator: { userId: 'u1' }, tenantId: 't1' }),
}))

describe('domains actions', () => {
  it('create domain request validates and returns success', async () => {
    const res = await actions.create({ schoolId: 's1', domain: 'example.com', notes: 'ok' } as any)
    expect(res).toEqual({ success: true })
  })
})

import { describe, it, expect, vi } from 'vitest'
import * as approve from '@/app/(platform)/operator/actions/domains/approve'
import * as reject from '@/app/(platform)/operator/actions/domains/reject'
import * as verify from '@/app/(platform)/operator/actions/domains/verify'
import * as create from '../../domains/actions'

describe('domains/actions.ts', () => {
  it('domainApprove validates and delegates', async () => {
    const spy = vi.spyOn(approve, 'approveDomainRequest').mockResolvedValue(undefined as any)
    await expect(create.domainApprove({ id: 'abc', notes: 'ok' })).resolves.toEqual({ success: true })
    expect(spy).toHaveBeenCalledWith('abc', 'ok')
  })

  it('domainReject validates and delegates', async () => {
    const spy = vi.spyOn(reject, 'rejectDomainRequest').mockResolvedValue(undefined as any)
    await expect(create.domainReject({ id: 'abc', notes: 'no' })).resolves.toEqual({ success: true })
    expect(spy).toHaveBeenCalledWith('abc', 'no')
  })

  it('domainVerify validates and delegates', async () => {
    const spy = vi.spyOn(verify, 'verifyDomainRequest').mockResolvedValue(undefined as any)
    await expect(create.domainVerify({ id: 'abc' })).resolves.toEqual({ success: true })
    expect(spy).toHaveBeenCalledWith('abc')
  })

  it('domainCreate requires valid domain', async () => {
    const spy = vi.spyOn((await import('@/app/(platform)/operator/actions/domains/create')), 'createDomainRequest').mockResolvedValue('id-1' as any)
    await expect(create.domainCreate({ schoolId: 's1', domain: 'example.com', notes: 'n' })).resolves.toEqual({ success: true })
    expect(spy).toHaveBeenCalled()
    // invalid domain
    // @ts-expect-error intentional invalid
    await expect(create.domainCreate({ schoolId: 's1', domain: '' })).rejects.toBeTruthy()
  })
})



