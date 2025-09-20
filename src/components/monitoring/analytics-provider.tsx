'use client';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { monitoringService } from '@/lib/monitoring-service';

export function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page views
    monitoringService.trackEvent({
      name: 'page_view',
      category: 'user_action',
      data: {
        path: pathname,
      },
    });
  }, [pathname]);

  return (
    <>
      <Analytics
        beforeSend={(event) => {
          // Add custom properties to analytics events
          if (typeof window !== 'undefined') {
            const schoolId = (window as any).__SCHOOL_ID__;
            if (schoolId) {
              return {
                ...event,
                schoolId,
              };
            }
          }
          return event;
        }}
      />
      <SpeedInsights
        route={pathname}
        properties={{
          environment: process.env.NODE_ENV,
        }}
      />
    </>
  );
}