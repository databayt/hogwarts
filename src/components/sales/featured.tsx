/**
 * Featured leads component
 * Displays high-priority or high-score leads
 */

'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  TrendingUp,
  Clock,
  Mail,
  Phone,
  Building,
  User,
  Target,
  Zap,
} from 'lucide-react';
import type { Lead } from './types';
import { LEAD_STATUS, LEAD_SCORE_RANGES } from './constants';

interface FeaturedProps {
  leads: Lead[];
  isLoading?: boolean;
  onRefresh?: () => void;
  dictionary?: Record<string, string>;
}

// Simple time ago formatter
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function Featured({ leads, isLoading, dictionary }: FeaturedProps) {
  const d = dictionary;

  // Categorize featured leads
  const categorizedLeads = useMemo(() => {
    const hotLeads = leads.filter(l => l.score >= LEAD_SCORE_RANGES.HOT.min);
    const recentLeads = leads
      .filter(l => {
        const daysSinceCreated = (Date.now() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreated <= 7;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const readyToContact = leads.filter(
      l => l.status === 'NEW' || l.status === 'QUALIFIED'
    ).slice(0, 10);

    return {
      hot: hotLeads,
      recent: recentLeads,
      readyToContact,
    };
  }, [leads]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{d?.loading || 'Loading featured leads...'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{d?.hotLeads || 'Hot Leads'}</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorizedLeads.hot.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{d?.score80Plus || 'Score 80+'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{d?.thisWeek || 'This Week'}</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorizedLeads.recent.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{d?.newLeads || 'New leads'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{d?.ready || 'Ready'}</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorizedLeads.readyToContact.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{d?.toContact || 'To contact'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Hot Leads Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">{d?.hotLeadsTitle || 'Hot Leads'} ({categorizedLeads.hot.length})</h3>
        </div>

        {categorizedLeads.hot.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            {d?.noHotLeads || 'No hot leads yet. Keep prospecting!'}
          </Card>
        ) : (
          <div className="grid gap-4">
            {categorizedLeads.hot.slice(0, 5).map((lead) => (
              <Card key={lead.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {lead.name}
                        <Badge variant="destructive">
                          <Trophy className="h-3 w-3 mr-1" />
                          {d?.score || 'Score'}: {lead.score}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        {lead.company && (
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {lead.company}
                          </span>
                        )}
                        {lead.title && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {lead.title}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {lead.email && (
                        <Button size="icon" variant="outline" asChild>
                          <a href={`mailto:${lead.email}`}>
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {lead.phone && (
                        <Button size="icon" variant="outline" asChild>
                          <a href={`tel:${lead.phone}`}>
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Progress value={lead.score} className="h-2" />
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">
                        {LEAD_STATUS[lead.status]}
                      </Badge>
                      <span className="text-muted-foreground">
                        {d?.added || 'Added'} {formatTimeAgo(new Date(lead.createdAt))}
                      </span>
                    </div>
                    {lead.tags && lead.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {lead.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Leads Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold">{d?.recentLeadsTitle || 'Recent Leads'} ({categorizedLeads.recent.length})</h3>
        </div>

        {categorizedLeads.recent.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            {d?.noRecentLeads || 'No new leads this week'}
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {categorizedLeads.recent.map((lead) => (
              <Card key={lead.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{lead.name}</CardTitle>
                      <CardDescription>
                        {lead.company} {lead.title && `• ${lead.title}`}
                      </CardDescription>
                    </div>
                    <Badge variant={lead.score >= 60 ? 'default' : 'secondary'}>
                      {d?.score || 'Score'}: {lead.score}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatTimeAgo(new Date(lead.createdAt))}
                    </div>
                    <div className="flex gap-2">
                      {lead.email && <Mail className="h-4 w-4 text-muted-foreground" />}
                      {lead.phone && <Phone className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
