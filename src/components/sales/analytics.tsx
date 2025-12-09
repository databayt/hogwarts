/**
 * Analytics component for Sales/Leads
 * Displays key metrics and visualizations
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  TrendingUp,
  Target,
  Award,
  Calendar,
  Mail,
  Building,
  Activity,
} from 'lucide-react';
import type { LeadAnalytics as LeadAnalyticsType } from './types';
import { LEAD_STATUS, LEAD_SOURCE } from './constants';

interface AnalyticsProps {
  analytics: LeadAnalyticsType | null;
  isLoading?: boolean;
  dictionary?: Record<string, string>;
}

export function Analytics({ analytics, isLoading, dictionary }: AnalyticsProps) {
  const d = dictionary;

  if (isLoading || !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{d?.loading || 'Loading analytics...'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{d?.totalLeads || 'Total Leads'}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {d?.allTimeTotal || 'All time total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{d?.newThisWeek || 'New This Week'}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.newLeadsThisWeek}</div>
            <p className="text-xs text-muted-foreground">
              {d?.last7Days || 'Last 7 days'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{d?.conversionRate || 'Conversion Rate'}</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {d?.closedWon || 'Closed won'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{d?.avgScore || 'Average Score'}</CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analytics.averageScore)}</div>
            <p className="text-xs text-muted-foreground">
              {d?.outOf100 || 'Out of 100'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {d?.statusDistribution || 'Status Distribution'}
            </CardTitle>
            <CardDescription>
              {d?.leadsbyStatus || 'Leads by status'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.statusDistribution.map((item) => (
              <div key={item.status} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {LEAD_STATUS[item.status] || item.status}
                    </Badge>
                  </span>
                  <span className="text-muted-foreground">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {d?.topSources || 'Top Sources'}
            </CardTitle>
            <CardDescription>
              {d?.whereLeadsCome || 'Where leads come from'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.topSources.map((item) => (
              <div key={item.source} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {LEAD_SOURCE[item.source] || item.source}
                    </Badge>
                  </span>
                  <span className="text-muted-foreground">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {d?.scoreDistribution || 'Score Distribution'}
          </CardTitle>
          <CardDescription>
            {d?.leadQuality || 'Lead quality breakdown'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {analytics.scoreDistribution.map((item) => (
              <div key={item.range} className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{item.count}</div>
                <div className="text-sm text-muted-foreground">{item.range}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
