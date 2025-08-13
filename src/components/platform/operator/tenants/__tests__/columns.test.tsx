import { describe, it, expect } from 'vitest'
import { tenantColumns } from '../../tenants/columns'

describe('tenantColumns', () => {
  it('defines expected filter meta for planType and isActive', () => {
    const plan = tenantColumns.find(c => c.accessorKey === 'planType')
    const status = tenantColumns.find(c => c.accessorKey === 'isActive')
    expect(plan?.meta).toBeDefined()
    expect(status?.meta).toBeDefined()
  })
})













