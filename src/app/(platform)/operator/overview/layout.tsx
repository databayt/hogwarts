import { Shell as PageContainer } from '@/components/table/shell';
import { Card } from '@/components/ui/card';
import React from 'react';
import { db } from '@/lib/db';
import { getTenantContext } from '@/components/platform/operator/lib/tenant';
import { RoleGate } from '@/components/auth/role-gate';
import { UserRole } from '@prisma/client';
import { PeriodSwitcher } from '@/components/platform/operator/overview/period-switcher';
import { MetricsCards } from '@/components/platform/operator/overview/metrics-cards';

export default async function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  // Founder/operator dashboard: aggregate across all schools by default
  const { isPlatformAdmin } = await getTenantContext();

  let totalSchools = 0;
  let activeSchools = 0;
  let totalUsers = 0;
  let totalStudents = 0;
  let deltas: { schools: number; users: number; students: number } | null = null;
  try {
    [totalSchools, activeSchools, totalUsers, totalStudents] = await Promise.all([
      db.school.count(),
      db.school.count({ where: { isActive: true } }),
      db.user.count(),
      db.student.count()
    ]);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/operator/overview/metrics?period=7d`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        deltas = json.deltas ?? null;
      }
    } catch {}
  } catch {
    // Safe fallbacks in case of transient DB errors; UI stays up
    totalSchools = 0;
    activeSchools = 0;
    totalUsers = 0;
    totalStudents = 0;
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            {isPlatformAdmin ? 'Founder Dashboard' : 'Dashboard'} 👋
          </h2>
          <div className='flex items-center gap-2'>
            <PeriodSwitcher />
          </div>
        </div>

        <MetricsCards totals={{ totalSchools, activeSchools, totalUsers, totalStudents }} />
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 md:col-span-3'>
            {/* sales arallel routes */}
            {sales}
          </div>
          <div className='col-span-4'>{area_stats}</div>
          <div className='col-span-4 md:col-span-3'>{pie_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}
