/**
 * Lead analytics dashboard component
 * Displays key metrics and insights about leads
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  Users,
  Target,
  Award,
} from 'lucide-react';
import { getLeadAnalytics } from './actions';
import { LEAD_STATUS, LEAD_SOURCE } from './constants';

interface AnalyticsProps {
  className?: string;
}

export function LeadAnalytics({ className = '' }: AnalyticsProps) {
  const [analytics, setAnalytics] = useState<{
    totalLeads: number;
    newLeadsThisWeek: number;
    statusDistribution?: Array<{ status: string; _count: number }>;
    sourceDistribution?: Array<{ source: string; _count: number }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const result = await getLeadAnalytics();
        if (result.success && result.data) {
          setAnalytics({
            totalLeads: result.data.totalLeads,
            newLeadsThisWeek: result.data.newLeadsThisWeek,
            statusDistribution: result.data.statusDistribution?.map(s => ({
              status: s.status,
              _count: s.count,
            })),
            sourceDistribution: result.data.topSources?.map(s => ({
              source: s.source,
              _count: s.count,
            })),
          });
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-none h-fit">
            <CardContent className="flex flex-col items-start p-2.5">
              <Skeleton className="h-8 w-8 rounded-full mb-1.5" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  if (!analytics) {
    return null;
  }

  // Calculate conversion rate (mock calculation)
  const conversionRate = analytics.totalLeads > 0
    ? Math.round((analytics.statusDistribution?.find((s) => s.status === 'CLOSED_WON')?._count || 0) / analytics.totalLeads * 100)
    : 0;

  return (
    <>
      {/* Total Leads Card */}
      <Card className="shadow-none h-fit">
        <CardContent className="flex flex-col items-start p-2.5">
          <Users className="h-8 w-8 text-muted-foreground mb-1.5" />
          <div className="text-3xl font-bold leading-tight">{analytics.totalLeads}</div>
          <p className="text-sm text-muted-foreground">Total Leads</p>
        </CardContent>
      </Card>

      {/* New This Week Card */}
      <Card className="shadow-none h-fit">
        <CardContent className="flex flex-col items-start p-2.5">
          <TrendingUp className="h-8 w-8 text-muted-foreground mb-1.5" />
          <div className="text-3xl font-bold leading-tight">{analytics.newLeadsThisWeek}</div>
          <p className="text-sm text-muted-foreground">New This Week</p>
        </CardContent>
      </Card>

      {/* Conversion Rate Card */}
      <Card className="shadow-none h-fit">
        <CardContent className="flex flex-col items-start p-2.5">
          <Target className="h-8 w-8 text-muted-foreground mb-1.5" />
          <div className="text-3xl font-bold leading-tight">{conversionRate}%</div>
          <p className="text-sm text-muted-foreground">Conversion Rate</p>
        </CardContent>
      </Card>

      {/* Top Source Card */}
      <Card className="shadow-none h-fit">
        <CardContent className="flex flex-col items-start p-2.5">
          <Award className="h-8 w-8 text-muted-foreground mb-1.5" />
          <div className="text-3xl font-bold leading-tight">
            {analytics.sourceDistribution?.[0]?.source
              ? LEAD_SOURCE[analytics.sourceDistribution[0].source as keyof typeof LEAD_SOURCE]
              : 'N/A'}
          </div>
          <p className="text-sm text-muted-foreground">Top Source</p>
        </CardContent>
      </Card>
    </>
  );
}
