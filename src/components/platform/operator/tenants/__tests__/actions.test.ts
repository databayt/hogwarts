import { describe, it, expect, vi } from 'vitest'
import * as toggle from '@/app/(platform)/operator/actions/tenants/toggle-active'
import * as changePlan from '@/app/(platform)/operator/actions/tenants/change-plan'
import * as endTrial from '@/app/(platform)/operator/actions/tenants/end-trial'
import * as startImp from '@/app/(platform)/operator/actions/impersonation/start'
import * as stopImp from '@/app/(platform)/operator/actions/impersonation/stop'
import * as tenants from '../../tenants/actions'

describe('tenants/actions.ts', () => {
  it('tenantToggleActive validates and delegates', async () => {
    const spy = vi.spyOn(toggle, 'toggleTenantActive').mockResolvedValue(undefined as any)
    await expect(tenants.tenantToggleActive({ tenantId: 't1', reason: 'r' })).resolves.toEqual({ success: true })
    expect(spy).toHaveBeenCalledWith('t1', 'r')
  })

  it('tenantChangePlan validates and delegates', async () => {
    const spy = vi.spyOn(changePlan, 'changeTenantPlan').mockResolvedValue(undefined as any)
    await expect(tenants.tenantChangePlan({ tenantId: 't1', planType: 'basic' })).resolves.toEqual({ success: true })
    expect(spy).toHaveBeenCalled()
  })

  it('tenantEndTrial validates and delegates', async () => {
    const spy = vi.spyOn(endTrial, 'endTenantTrial').mockResolvedValue(undefined as any)
    await expect(tenants.tenantEndTrial({ tenantId: 't1' })).resolves.toEqual({ success: true })
    expect(spy).toHaveBeenCalled()
  })

  it('tenantStartImpersonation validates and delegates', async () => {
    const spy = vi.spyOn(startImp, 'startImpersonation').mockResolvedValue(undefined as any)
    await expect(tenants.tenantStartImpersonation({ tenantId: 't1', reason: 'r' })).resolves.toEqual({ success: true })
    expect(spy).toHaveBeenCalledWith('t1', 'r')
  })

  it('tenantStopImpersonation validates and delegates', async () => {
    const spy = vi.spyOn(stopImp, 'stopImpersonation').mockResolvedValue(undefined as any)
    await expect(tenants.tenantStopImpersonation({ reason: 'r' })).resolves.toEqual({ success: true })
    expect(spy).toHaveBeenCalledWith('r')
  })
})









